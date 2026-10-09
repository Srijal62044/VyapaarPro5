import { createClient } from '@supabase/supabase-js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return UUID_REGEX.test(str.trim());
}

/**
 * FamGateway Order Status & Polling Endpoint
 * GET /api/famgateway/order-status/:orderId
 * GET /api/famgateway/order-status?orderId=...
 *
 * Polled by In-Page QR modal to detect completion without page redirects.
 */
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Extract order identifier from path or query params
    const rawUrl = req.url || '';
    const match = rawUrl.match(/\/api\/famgateway\/order-status\/([^/?#]+)/);
    const pathOrderId = match ? decodeURIComponent(match[1]) : '';
    const queryOrderId = req.query?.orderId || req.query?.order_id || req.query?.id;
    const orderIdentifier = String(pathOrderId || queryOrderId || '').trim();

    if (!orderIdentifier) {
      return res.status(400).json({ error: 'Order ID or order number is required.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({
        status: 'PENDING',
        paid: false,
        message: 'Database not configured in preview.',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Locate order by UUID, order_number, or gateway_order_id
    let order: any = null;
    let payment: any = null;

    if (isUuid(orderIdentifier)) {
      const { data: oById } = await supabase
        .from('store_orders')
        .select('*, store_order_items(*)')
        .eq('id', orderIdentifier)
        .maybeSingle();
      if (oById) order = oById;
    }

    if (!order) {
      const { data: oByNum } = await supabase
        .from('store_orders')
        .select('*, store_order_items(*)')
        .eq('order_number', orderIdentifier)
        .maybeSingle();
      if (oByNum) order = oByNum;
    }

    if (!order) {
      // Check store_payments by gateway_order_id
      const { data: payRecord } = await supabase
        .from('store_payments')
        .select('*, store_orders(*, store_order_items(*))')
        .eq('gateway_order_id', orderIdentifier)
        .maybeSingle();

      if (payRecord) {
        payment = payRecord;
        order = payRecord.store_orders;
      }
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found.', status: 'NOT_FOUND', paid: false });
    }

    // If order is already confirmed PAID or DELIVERED
    if (order.status === 'PAID' || order.status === 'DELIVERED') {
      return res.status(200).json({
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paid: true,
        order,
      });
    }

    // Find the latest payment record for this order
    if (!payment) {
      const { data: pay } = await supabase
        .from('store_payments')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      payment = pay;
    }

    // 2. Check FamGateway API if API key is present on Vercel
    const famApiKey = process.env.FAMGATEWAY_API_KEY;
    const gatewayOrderId = payment?.gateway_order_id;

    if (famApiKey && gatewayOrderId) {
      const verifyUrl = `https://famgateway.in/api/verify-order.php?api_key=${encodeURIComponent(famApiKey.trim())}&order_id=${encodeURIComponent(gatewayOrderId.trim())}`;
      try {
        const gwRes = await fetch(verifyUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${famApiKey.trim()}`,
            'X-Api-Key': famApiKey.trim(),
            'Accept': 'application/json',
          },
        });

        if (gwRes.ok) {
          const gwText = await gwRes.text();
          let gwData: any = {};
          try {
            gwData = JSON.parse(gwText);
          } catch {
            gwData = { gwText };
          }

          const gwStatus = (gwData.status || gwData.data?.status || '').toLowerCase().trim();
          if (gwStatus === 'success') {
            // Update order to PAID
            await supabase
              .from('store_orders')
              .update({
                status: 'PAID',
                updated_at: new Date().toISOString(),
              })
              .eq('id', order.id);

            if (payment) {
              await supabase
                .from('store_payments')
                .update({
                  status: 'SUCCESS',
                  gateway_payment_id: gwData.data?.transaction_id || gwData.data?.utr,
                  gateway_reference: gwData.data?.utr,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', payment.id);
            }

            order.status = 'PAID';
            return res.status(200).json({
              success: true,
              orderId: order.id,
              orderNumber: order.order_number,
              status: 'PAID',
              paid: true,
              order,
            });
          }
        }
      } catch (pollErr: any) {
        console.warn('[famgateway/order-status] Polling gateway error:', pollErr?.message);
      }
    }

    // Order is still pending
    return res.status(200).json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status || 'PAYMENT_PENDING',
      paid: false,
    });
  } catch (err: any) {
    console.error('[famgateway/order-status] error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
