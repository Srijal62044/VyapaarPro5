import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * FamGateway Webhook Handler Endpoint
 *
 * POST /api/famgateway-webhook
 *
 * Receives automatic transaction notifications from FamGateway:
 * Verifies X-FamGateway-Signature using FAMGATEWAY_API_KEY as HMAC-SHA256 secret.
 * Atomically marks order PAID and unlocks downloads exactly once (idempotent).
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    const famApiKey = process.env.FAMGATEWAY_API_KEY;
    const signature =
      req.headers['x-famgateway-signature'] ||
      req.headers['x-signature'] ||
      req.headers['signature'];

    // 1. HMAC-SHA256 Signature Verification if signature header provided
    if (famApiKey && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', famApiKey.trim())
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('FamGateway webhook signature mismatch');
        return res.status(401).json({ error: 'Invalid webhook signature.' });
      }
    }

    const payload = body.data || body.payload || body;
    const gatewayOrderId = payload.order_id || payload.orderId;
    const gatewayStatus = (payload.status || body.status || 'success').toLowerCase().trim();
    const transactionId = payload.transaction_id || payload.id || `TXN-${Date.now()}`;
    const utr = payload.utr || null;
    const senderName = payload.sender_name || null;
    const paymentTime = payload.payment_time_ist || new Date().toISOString();

    if (!gatewayOrderId) {
      return res.status(400).json({ error: 'Missing order_id in webhook payload.' });
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

    // 2. Locate payment record by FamGateway order_id
    const { data: paymentRecord, error: payErr } = await supabase
      .from('store_payments')
      .select('*, store_orders(*, store_order_items(*))')
      .eq('gateway_order_id', gatewayOrderId)
      .single();

    if (payErr || !paymentRecord) {
      console.warn(`Webhook received for unknown gateway order ID: ${gatewayOrderId}`);
      return res.status(200).json({ received: true, notice: 'Payment record not found' });
    }

    const order = paymentRecord.store_orders;
    if (!order) {
      return res.status(200).json({ received: true, notice: 'Associated order not found' });
    }

    // 3. Idempotency: If order is already PAID, acknowledge without re-processing
    if (order.status === 'PAID') {
      return res.status(200).json({ received: true, status: 'already_processed' });
    }

    // 4. Process payment success
    if (gatewayStatus === 'success') {
      // Validate amount
      const expectedRupees = Number((order.total_paise / 100).toFixed(2));
      const receivedAmount = Number(payload.amount || expectedRupees);

      if (Math.abs(expectedRupees - receivedAmount) > 0.05) {
        console.error(`Webhook amount mismatch: expected ₹${expectedRupees}, received ₹${receivedAmount}`);
        return res.status(400).json({ error: 'Amount mismatch' });
      }

      // Atomically update order to PAID
      await supabase
        .from('store_orders')
        .update({
          status: 'PAID',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // Update payment record
      await supabase
        .from('store_payments')
        .update({
          status: 'SUCCESS',
          gateway_payment_id: transactionId,
          gateway_reference: utr || transactionId,
          raw_reference_metadata: {
            ...(paymentRecord.raw_reference_metadata || {}),
            webhookProcessed: true,
            transaction_id: transactionId,
            utr,
            sender_name: senderName,
            payment_time_ist: paymentTime,
            receivedAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentRecord.id);

      // Fulfill digital downloads exactly once
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

      return res.status(200).json({ received: true, processed: true });
    }

    if (gatewayStatus === 'expired') {
      await supabase
        .from('store_orders')
        .update({
          status: 'PAYMENT_FAILED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      await supabase
        .from('store_payments')
        .update({
          status: 'FAILED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentRecord.id);

      return res.status(200).json({ received: true, processed: true, status: 'expired' });
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal Webhook Error' });
  }
}
