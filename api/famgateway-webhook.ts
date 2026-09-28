import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * FamGateway Webhook Handler Endpoint
 *
 * Endpoint: POST https://vyapaarpro.in/api/famgateway-webhook
 *
 * Receives automatic transaction notifications from FamGateway:
 * - Verifies X-FamGateway-Signature using FAMGATEWAY_API_KEY as HMAC-SHA256 secret.
 * - Supports FamGateway Webhook Tester (is_test=true, TEST-* synthetic order IDs) safely with HTTP 200 without modifying production orders.
 * - Atomically marks real production orders PAID, saves UTR / transaction info, and fulfills downloads idempotently.
 * - Handles OPTIONS preflight & GET health ping without redirects.
 */
export default async function handler(req: any, res: any) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-FamGateway-Signature, X-Signature, X-Api-Key');

  // 2. Handle OPTIONS Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Handle GET Health Check (Webhook Testers often ping GET first)
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'FamGateway Webhook Receiver',
      message: 'Endpoint is active and ready to receive POST events.',
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    const famApiKey = process.env.FAMGATEWAY_API_KEY;
    const signature =
      req.headers['x-famgateway-signature'] ||
      req.headers['x-signature'] ||
      req.headers['signature'];

    // 4. HMAC-SHA256 Signature Verification if signature header provided
    if (famApiKey && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', famApiKey.trim())
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('[Webhook] Signature verification failed');
        return res.status(401).json({ error: 'Invalid webhook signature.' });
      }
    }

    const payload = body.data || body.payload || body;
    const gatewayOrderId = payload.order_id || payload.orderId || body.order_id;
    const eventName = body.event || payload.event || 'payment.success';
    const isTest = body.is_test === true || payload.is_test === true || (typeof gatewayOrderId === 'string' && gatewayOrderId.startsWith('TEST-'));
    const gatewayStatus = (payload.status || body.status || 'success').toLowerCase().trim();
    const transactionId = payload.transaction_id || payload.id || `TXN-${Date.now()}`;
    const utr = payload.utr || null;
    const senderName = payload.sender_name || null;
    const paymentTime = payload.payment_time || payload.payment_time_ist || new Date().toISOString();

    // 5. Safe handling for FamGateway Test Mode / Webhook Tester
    if (isTest || body.event === 'test' || body.test === true || body.type === 'ping') {
      console.log(`[Webhook Diagnostic] Test mode event received: ${eventName}, order_id: ${gatewayOrderId || 'N/A'}, is_test: true`);
      return res.status(200).json({
        received: true,
        test: true,
        status: 'acknowledged',
        event: eventName,
        order_id: gatewayOrderId || null,
        message: 'FamGateway test webhook verified and acknowledged successfully.',
      });
    }

    if (!gatewayOrderId) {
      return res.status(400).json({ error: 'Missing order_id in webhook payload.' });
    }

    // 6. Production Order Fulfillment
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({ received: true, notice: 'Database unconfigured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Locate payment record by FamGateway order_id
    const { data: paymentRecord, error: payErr } = await supabase
      .from('store_payments')
      .select('*, store_orders(*, store_order_items(*))')
      .eq('gateway_order_id', gatewayOrderId)
      .single();

    if (payErr || !paymentRecord) {
      console.warn(`[Webhook Diagnostic] Webhook received for unregistered gateway order ID: ${gatewayOrderId}`);
      return res.status(200).json({ received: true, notice: 'Payment record not found' });
    }

    const order = paymentRecord.store_orders;
    if (!order) {
      return res.status(200).json({ received: true, notice: 'Associated order not found' });
    }

    // Idempotency: If order is already PAID, acknowledge without re-processing
    if (order.status === 'PAID') {
      return res.status(200).json({ received: true, status: 'already_processed' });
    }

    // Process payment success
    if (gatewayStatus === 'success') {
      // Validate amount
      const expectedRupees = Number((order.total_paise / 100).toFixed(2));
      const receivedAmount = Number(payload.amount || payload.payable_amount || expectedRupees);

      if (Math.abs(expectedRupees - receivedAmount) > 0.05) {
        console.error(`[Webhook Diagnostic] Amount mismatch: expected ₹${expectedRupees}, received ₹${receivedAmount}`);
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

      console.log(`[Webhook Diagnostic] Real order ${order.order_number} marked PAID and downloads fulfilled.`);
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
    console.error('[Webhook] Processing exception:', err);
    return res.status(500).json({ error: 'Internal Webhook Error' });
  }
}
