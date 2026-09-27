import { createClient } from '@supabase/supabase-js';

/**
 * Payment Verification Endpoint
 *
 * Checks authoritative payment status.
 * Note: FamGateway's currently provided documentation covers only order creation
 * (POST https://famgateway.in/api/create-order.php with amount & redirect_url).
 *
 * Orders are NOT marked PAID automatically based on frontend navigation alone.
 * This endpoint verifies authoritative records and returns the true status.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { orderId } = body;

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

    // 1. Fetch Order and payment records
    const { data: order, error: orderErr } = await supabase
      .from('store_orders')
      .select('*, store_order_items(*), store_payments(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const isPaid = order.status === 'PAID';
    const latestPayment = order.store_payments?.[0];

    return res.status(200).json({
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
      verified: isPaid,
      amountPaise: order.total_paise,
      currency: order.currency,
      gatewayOrderId: latestPayment?.gateway_order_id || null,
      gatewayPaymentStatus: latestPayment?.status || 'PENDING',
      message: isPaid
        ? 'Payment verified'
        : 'Payment is pending authoritative confirmation from gateway.',
    });
  } catch (err: any) {
    console.error('payment/verify error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
