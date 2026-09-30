import { createClient } from '@supabase/supabase-js';
import { getCachedOrder } from './order-store';

/**
 * FamGateway Payment Verification Endpoint
 *
 * GET/POST /api/store/payment/verify?order_id={internalOrderId}
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
      const cached = getCachedOrder(orderId);
      return res.status(200).json({
        orderId: cached?.id || orderId,
        status: cached?.status || 'PAYMENT_REVIEW',
        verified: false,
        message: 'Database unconfigured',
      });
    }

    const cleanId = String(orderId || '').trim();
    const isCleanUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

    // 1. Fetch Order with items and payment history via universal resolution
    let order: any = null;

    try {
      // 1.1 If cleanId is a UUID, check store_orders.id directly
      if (isCleanUuid) {
        const { data: byId } = await supabase
          .from('store_orders')
          .select('*, store_order_items(*), store_payments(*)')
          .eq('id', cleanId)
          .maybeSingle();
        if (byId) order = byId;
      }

      // 1.2 Search store_orders.order_number
      if (!order) {
        const { data: byNum } = await supabase
          .from('store_orders')
          .select('*, store_order_items(*), store_payments(*)')
          .eq('order_number', cleanId)
          .maybeSingle();
        if (byNum) order = byNum;
      }

      // 1.3 Search store_payments by gateway_order_id, gateway_payment_id, gateway_reference
      if (!order) {
        const { data: payments } = await supabase
          .from('store_payments')
          .select('order_id')
          .or(`gateway_order_id.eq.${cleanId},gateway_payment_id.eq.${cleanId},gateway_reference.eq.${cleanId}`)
          .limit(1);

        if (payments && payments.length > 0 && payments[0].order_id) {
          const { data: byPayment } = await supabase
            .from('store_orders')
            .select('*, store_order_items(*), store_payments(*)')
            .eq('id', payments[0].order_id)
            .maybeSingle();
          if (byPayment) order = byPayment;
        }
      }

      // 1.4 If cleanId is UUID, check store_payments.id
      if (!order && isCleanUuid) {
        const { data: payById } = await supabase
          .from('store_payments')
          .select('order_id')
          .eq('id', cleanId)
          .maybeSingle();

        if (payById && payById.order_id) {
          const { data: byPayId } = await supabase
            .from('store_orders')
            .select('*, store_order_items(*), store_payments(*)')
            .eq('id', payById.order_id)
            .maybeSingle();
          if (byPayId) order = byPayId;
        }
      }
    } catch (lookupErr) {
      console.warn('[payment-verify] Supabase order resolution notice:', lookupErr);
    }

    if (!order) {
      order = getCachedOrder(cleanId);
    }

    console.log('[payment-verify] Order resolution:', {
      requestedIdentifier: cleanId,
      resolvedOrderNumber: order?.order_number,
      resolvedOrderId: order?.id,
      currentStatus: order?.status,
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found in database.' });
    }

    // 2. If already manually approved (PAID or DELIVERED) or REJECTED by admin
    if (order.status === 'PAID' || order.status === 'DELIVERED') {
      const latestPayment = order.store_payments?.[0];
      return res.status(200).json({
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        fulfillmentStatus: order.fulfillment_status,
        verified: true,
        amountPaise: order.total_paise,
        currency: order.currency,
        gatewayOrderId: latestPayment?.gateway_order_id || null,
        gatewayPaymentId: latestPayment?.gateway_payment_id || null,
        message: 'Payment has been confirmed and approved by administrator.',
      });
    }

    if (order.status === 'REJECTED') {
      return res.status(200).json({
        orderId: order.id,
        orderNumber: order.order_number,
        status: 'REJECTED',
        verified: false,
        rejectionReason: order.payment_rejection_reason,
        message: `Payment review rejected: ${order.payment_rejection_reason || 'Could not be verified.'}`,
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
        message: 'No gateway order ID associated with this order.',
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
    }

    // 5. Evaluate authoritative FamGateway response
    const paymentData = famGatewayData?.data || famGatewayData?.response?.data || famGatewayData;

    if (famGatewayStatus === 'success') {
      const transactionId = paymentData?.transaction_id || paymentData?.utr || `TXN-${Date.now()}`;
      const utr = paymentData?.utr || null;
      const senderName = paymentData?.sender_name || null;
      const paymentTime = paymentData?.payment_time_ist || new Date().toISOString();

      // Set order to PAYMENT_REVIEW (Awaiting manual admin approval)
      if (order.status !== 'PAYMENT_REVIEW') {
        await supabase
          .from('store_orders')
          .update({
            status: 'PAYMENT_REVIEW',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        // Audit log
        await supabase.from('store_order_audit_logs').insert({
          order_id: order.id,
          action: 'PAYMENT_SUBMITTED_FOR_REVIEW',
          previous_status: order.status,
          new_status: 'PAYMENT_REVIEW',
          details: {
            gatewayOrderId,
            transactionId,
            utr,
            senderName,
            paymentTime,
            verifiedVia: 'verify-order.php',
          },
        });
      }

      // Update store_payments with transaction data
      if (latestPayment?.id) {
        await supabase
          .from('store_payments')
          .update({
            status: 'REVIEW',
            gateway_payment_id: transactionId,
            gateway_reference: utr || transactionId,
            raw_reference_metadata: {
              ...(latestPayment.raw_reference_metadata || {}),
              transaction_id: transactionId,
              utr,
              sender_name: senderName,
              payment_time_ist: paymentTime,
              verificationResponse: famGatewayData,
              reviewedSubmissionAt: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', latestPayment.id);
      }

      return res.status(200).json({
        orderId: order.id,
        orderNumber: order.order_number,
        status: 'PAYMENT_REVIEW',
        verified: false,
        requiresAdminApproval: true,
        amountPaise: order.total_paise,
        currency: order.currency,
        transactionId,
        utr,
        senderName,
        paymentTime,
        message: 'Your payment has been received and is currently under review. You will be contacted within a few hours.',
      });
    }

    if (famGatewayStatus === 'expired') {
      await supabase
        .from('store_orders')
        .update({
          status: 'CANCELLED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      return res.status(200).json({
        orderId: order.id,
        orderNumber: order.order_number,
        status: 'CANCELLED',
        verified: false,
        message: 'Payment session expired. Please create a new checkout to retry.',
      });
    }

    // Default: Order is in review / pending
    return res.status(200).json({
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status === 'CREATED' ? 'PAYMENT_REVIEW' : order.status,
      verified: false,
      gatewayOrderId,
      message: 'Your payment has been received and is currently under review.',
    });
  } catch (err: any) {
    console.error('verify endpoint error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
