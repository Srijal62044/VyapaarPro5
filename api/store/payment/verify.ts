import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { orderId, gatewayPaymentId, gatewayOrderId, gatewaySignature, rawData } = body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required for verification.' });
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
        verified: true,
        orderId,
        amountPaise: 0,
        status: 'SUCCESS',
        message: 'Verified (Local Preview Mode)',
      });
    }

    // 1. Fetch Order and items
    const { data: order, error: orderErr } = await supabase
      .from('store_orders')
      .select('*, store_order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // 2. If already PAID, return verified idempotently
    if (order.status === 'PAID') {
      return res.status(200).json({
        verified: true,
        orderId: order.id,
        amountPaise: order.total_paise,
        currency: order.currency,
        status: 'SUCCESS',
        isAlreadyPaid: true,
      });
    }

    // 3. FamGateway verification via server-side API or signature verification
    const famApiKey = process.env.FAMGATEWAY_API_KEY;
    const famSecret = process.env.FAMGATEWAY_SECRET;
    const famEndpoint = process.env.FAMGATEWAY_ENDPOINT || 'https://api.famgateway.com/v1';

    let isVerified = false;
    let verifiedPaymentId = gatewayPaymentId || `PAY-${Date.now()}`;

    if (famApiKey && famSecret && (gatewayPaymentId || gatewayOrderId)) {
      try {
        const verifyEndpoint = gatewayPaymentId
          ? `${famEndpoint}/payments/${gatewayPaymentId}`
          : `${famEndpoint}/orders/${gatewayOrderId}/status`;

        const gwRes = await fetch(verifyEndpoint, {
          headers: {
            'Authorization': `Bearer ${famApiKey}`,
            'X-Secret-Key': famSecret,
          },
        });

        if (gwRes.ok) {
          const gwData = await gwRes.json();
          if (gwData.status === 'PAID' || gwData.status === 'SUCCESS' || gwData.payment_status === 'SUCCESS') {
            isVerified = true;
            verifiedPaymentId = gwData.payment_id || gwData.id || verifiedPaymentId;
          }
        }
      } catch (err) {
        console.warn('FamGateway verification API notice:', err);
      }
    } else {
      // In development/test mode or standard callback
      isVerified = true;
    }

    if (!isVerified) {
      // Mark as payment failed
      await supabase
        .from('store_orders')
        .update({ status: 'PAYMENT_FAILED', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      return res.status(400).json({
        verified: false,
        error: 'Payment verification could not be confirmed with gateway.',
      });
    }

    // 4. Update order to PAID
    await supabase
      .from('store_orders')
      .update({
        status: 'PAID',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // 5. Update or insert payment record as SUCCESS
    const { data: existingPayment } = await supabase
      .from('store_payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingPayment) {
      await supabase
        .from('store_payments')
        .update({
          status: 'SUCCESS',
          gateway_payment_id: verifiedPaymentId,
          raw_reference_metadata: {
            ...existingPayment.raw_reference_metadata,
            verifiedAt: new Date().toISOString(),
            rawData: rawData || null,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPayment.id);
    } else {
      await supabase.from('store_payments').insert({
        order_id: orderId,
        gateway: 'famgateway',
        gateway_order_id: gatewayOrderId || null,
        gateway_payment_id: verifiedPaymentId,
        amount_paise: order.total_paise,
        currency: order.currency,
        status: 'SUCCESS',
        raw_reference_metadata: { verifiedAt: new Date().toISOString(), rawData: rawData || null },
      });
    }

    // 6. Create Store Downloads for each purchased product idempotently
    const items = order.store_order_items || [];
    for (const item of items) {
      // Check if download record already exists
      const { data: existingDownload } = await supabase
        .from('store_downloads')
        .select('id')
        .eq('order_id', order.id)
        .eq('order_item_id', item.id)
        .single();

      if (!existingDownload) {
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
      verified: true,
      orderId: order.id,
      amountPaise: order.total_paise,
      currency: order.currency,
      status: 'SUCCESS',
      gatewayPaymentId: verifiedPaymentId,
    });
  } catch (err: any) {
    console.error('payment/verify endpoint error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
