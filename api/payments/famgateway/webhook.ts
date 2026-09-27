import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    const webhookSecret = process.env.FAMGATEWAY_WEBHOOK_SECRET;
    const signature = req.headers['x-famgateway-signature'] || req.headers['x-signature'];

    // 1. Signature Verification if secret is configured
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('FamGateway webhook signature mismatch');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = body.event || body.type || 'payment.success';
    const payload = body.data || body.payload || body;

    const orderId = payload.order_id || payload.merchant_reference || payload.orderId;
    const gatewayPaymentId = payload.payment_id || payload.id || payload.gatewayPaymentId;
    const paymentStatus = payload.status || payload.payment_status || 'SUCCESS';

    if (!orderId) {
      return res.status(400).json({ error: 'Missing order reference in webhook payload' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ received: true });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from('store_orders')
      .select('*, store_order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      console.warn(`Webhook received for non-existent order: ${orderId}`);
      return res.status(200).json({ received: true, notice: 'Order not found' });
    }

    // Idempotency: If already paid, acknowledge without re-processing
    if (order.status === 'PAID') {
      return res.status(200).json({ received: true, status: 'already_processed' });
    }

    if (paymentStatus === 'SUCCESS' || paymentStatus === 'PAID' || event === 'payment.success') {
      // 1. Update order to PAID
      await supabase
        .from('store_orders')
        .update({
          status: 'PAID',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      // 2. Update/Insert payment record
      await supabase.from('store_payments').insert({
        order_id: order.id,
        gateway: 'famgateway',
        gateway_payment_id: gatewayPaymentId || `WEBHOOK-PAY-${Date.now()}`,
        amount_paise: order.total_paise,
        currency: order.currency,
        status: 'SUCCESS',
        raw_reference_metadata: {
          webhookEvent: event,
          receivedAt: new Date().toISOString(),
          payload,
        },
      });

      // 3. Create Store Downloads idempotently
      const items = order.store_order_items || [];
      for (const item of items) {
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
    }

    return res.status(200).json({ received: true, processed: true });
  } catch (err: any) {
    console.error('FamGateway webhook processing error:', err);
    return res.status(500).json({ error: 'Internal Webhook Error' });
  }
}
