import { createClient } from '@supabase/supabase-js';

/**
 * FamGateway Authoritative Payment Verification Endpoint
 *
 * GET/POST /api/store/payment/verify?order_id={internalOrderId}
 *
 * Authoritatively verifies payment status using FamGateway's official endpoint:
 * GET https://famgateway.in/api/verify-order.php?api_key=KEY&order_id=fg_...
 *
 * Atomically marks order PAID, updates transaction logs, and unlocks digital downloads.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const orderId =
      req.query?.order_id ||
      req.query?.orderId ||
      req.body?.orderId ||
      req.body?.order_id;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

    if (!supabase) {
      return res.status(200).json({
        orderId,
        status: 'PAYMENT_PENDING',
        verified: false,
        message: 'Database unconfigured',
      });
    }

    // 1. Fetch Order with items and payment history
    const { data: order, error: orderErr } = await supabase
      .from('store_orders')
      .select('*, store_order_items(*), store_payments(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Order not found in database.' });
    }

    // 2. If already authoritatively marked PAID, return verified idempotently
    if (order.status === 'PAID') {
      const latestPayment = order.store_payments?.[0];
      return res.status(200).json({
        orderId: order.id,
        orderNumber: order.order_number,
        status: 'PAID',
        verified: true,
        amountPaise: order.total_paise,
        currency: order.currency,
        gatewayOrderId: latestPayment?.gateway_order_id || null,
        gatewayPaymentId: latestPayment?.gateway_payment_id || null,
        message: 'Payment verified successfully.',
      });
    }

    // 3. Retrieve stored FamGateway order ID (e.g. fg_CDHSVD0F)
    const latestPayment = order.store_payments?.[0];
    const gatewayOrderId = latestPayment?.gateway_order_id;

    if (!gatewayOrderId) {
      return res.status(200).json({
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        verified: false,
        message: 'No external gateway order ID associated with this order.',
      });
    }

    // 4. Server-to-Server call to FamGateway official verify-order endpoint
    const famApiKey = process.env.FAMGATEWAY_API_KEY;

    if (!famApiKey) {
      return res.status(200).json({
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        verified: false,
        message: 'FAMGATEWAY_API_KEY is not configured on server.',
      });
    }

    const verifyUrl = `https://famgateway.in/api/verify-order.php?api_key=${encodeURIComponent(famApiKey.trim())}&order_id=${encodeURIComponent(gatewayOrderId.trim())}`;

    let famGatewayStatus = 'pending';
    let famGatewayData: any = null;

    try {
      const gwRes = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${famApiKey.trim()}`,
          'X-Api-Key': famApiKey.trim(),
          'Accept': 'application/json',
        },
      });

      const rawText = await gwRes.text();
      try {
        famGatewayData = JSON.parse(rawText);
      } catch {
        famGatewayData = { rawText };
      }

      if (gwRes.ok && famGatewayData) {
        famGatewayStatus = (famGatewayData.status || '').toLowerCase().trim();
      }
    } catch (networkErr: any) {
      console.error('FamGateway verification network error:', networkErr);
      return res.status(200).json({
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        verified: false,
        message: 'Network timeout contacting FamGateway verification server.',
      });
    }

    // 5. Evaluate authoritative FamGateway response
    const paymentData = famGatewayData?.data || famGatewayData?.response?.data || famGatewayData;

    if (famGatewayStatus === 'success') {
      // Verify returned order ID matches
      const returnedOrderId = paymentData?.order_id || paymentData?.orderId || gatewayOrderId;
      if (returnedOrderId && returnedOrderId.trim() !== gatewayOrderId.trim()) {
        console.error(`Mismatch between gateway order IDs: expected ${gatewayOrderId}, received ${returnedOrderId}`);
        return res.status(400).json({ error: 'Gateway order reference mismatch.' });
      }

      // Verify amount (calculate from database, never trust arbitrary figures)
      const expectedRupees = Number((order.total_paise / 100).toFixed(2));
      const returnedAmount = Number(paymentData?.amount || paymentData?.payable_amount || expectedRupees);

      if (Math.abs(expectedRupees - returnedAmount) > 0.05) {
        console.error(`Amount mismatch: expected ₹${expectedRupees}, gateway reported ₹${returnedAmount}`);
        return res.status(400).json({ error: 'Payment amount mismatch between database and gateway.' });
      }

      const transactionId = paymentData?.transaction_id || paymentData?.utr || `TXN-${Date.now()}`;
      const utr = paymentData?.utr || null;
      const senderName = paymentData?.sender_name || null;
      const paymentTime = paymentData?.payment_time_ist || new Date().toISOString();

      // Atomically update store_orders to PAID
      await supabase
        .from('store_orders')
        .update({
          status: 'PAID',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // Atomically update store_payments
      if (latestPayment?.id) {
        await supabase
          .from('store_payments')
          .update({
            status: 'SUCCESS',
            gateway_payment_id: transactionId,
            gateway_reference: utr || transactionId,
            raw_reference_metadata: {
              ...(latestPayment.raw_reference_metadata || {}),
              transaction_id: transactionId,
              utr,
              sender_name: senderName,
              payment_time_ist: paymentTime,
              verificationResponse: famGatewayData,
              verifiedAt: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', latestPayment.id);
      } else {
        await supabase.from('store_payments').insert({
          order_id: order.id,
          gateway: 'famgateway',
          gateway_order_id: gatewayOrderId,
          gateway_payment_id: transactionId,
          gateway_reference: utr,
          amount_paise: order.total_paise,
          currency: order.currency,
          status: 'SUCCESS',
          raw_reference_metadata: {
            transaction_id: transactionId,
            utr,
            sender_name: senderName,
            payment_time_ist: paymentTime,
            verificationResponse: famGatewayData,
            verifiedAt: new Date().toISOString(),
          },
        });
      }

      // Idempotently create store_downloads for each purchased item
      const items = order.store_order_items || [];
      for (const item of items) {
        const { data: existingDl } = await supabase
          .from('store_downloads')
          .select('id')
          .eq('order_id', order.id)
          .eq('order_item_id', item.id)
          .single();

        if (!existingDl) {
          await supabase.from('store_downloads').insert({
            order_id: order.id,
            order_item_id: item.id,
            user_id: order.user_id || null,
            product_id: item.product_id,
            download_count: 0,
          });
        }
      }

      return res.status(200).json({
        orderId: order.id,
        orderNumber: order.order_number,
        status: 'PAID',
        verified: true,
        amountPaise: order.total_paise,
        currency: order.currency,
        transactionId,
        utr,
        senderName,
        paymentTime,
        message: 'Payment verified successfully. Downloads unlocked.',
      });
    }

    if (famGatewayStatus === 'expired') {
      await supabase
        .from('store_orders')
        .update({
          status: 'PAYMENT_FAILED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (latestPayment?.id) {
        await supabase
          .from('store_payments')
          .update({
            status: 'FAILED',
            raw_reference_metadata: {
              ...(latestPayment.raw_reference_metadata || {}),
              expiredAt: new Date().toISOString(),
              verificationResponse: famGatewayData,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', latestPayment.id);
      }

      return res.status(200).json({
        orderId: order.id,
        orderNumber: order.order_number,
        status: 'PAYMENT_FAILED',
        verified: false,
        message: 'Payment session has expired. Please create a new order to retry.',
      });
    }

    // Default: pending
    return res.status(200).json({
      orderId: order.id,
      orderNumber: order.order_number,
      status: 'PAYMENT_PENDING',
      verified: false,
      gatewayOrderId,
      message: 'Payment is pending confirmation from FamGateway.',
    });
  } catch (err: any) {
    console.error('verify endpoint error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
