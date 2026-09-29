import { createClient } from '@supabase/supabase-js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return UUID_REGEX.test(str.trim());
}

/**
 * FamGateway Create Order Serverless API Endpoint
 *
 * Calls the official FamGateway endpoint:
 * POST https://famgateway.in/api/create-order.php
 */
export default async function handler(req: any, res: any) {
  // CORS & Header handling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body: any = {};
    if (typeof req.body === 'string') {
      try {
        body = req.body.trim() ? JSON.parse(req.body) : {};
      } catch {
        body = {};
      }
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
    }

    const orderId = body.orderId || body.order_id || body.id || body.order?.id;

    console.log('[payment/create] request received', {
      hasOrderId: !!orderId,
    });

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
      return res.status(500).json({ error: 'Database service is not configured.' });
    }

    // 1. Fetch order directly from database
    let order: any = null;

    if (isUuid(orderId)) {
      const { data: orderById } = await supabase
        .from('store_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (orderById) order = orderById;
    }

    if (!order) {
      const { data: orderByNumber } = await supabase
        .from('store_orders')
        .select('*')
        .eq('order_number', String(orderId).trim())
        .maybeSingle();

      if (orderByNumber) order = orderByNumber;
    }

    if (!order) {
      console.warn('[payment/create] order lookup failed for:', { hasOrderId: !!orderId });
      return res.status(404).json({ error: 'Order not found in database.' });
    }

    if (order.status === 'PAID') {
      return res.status(400).json({ error: 'Order has already been paid.' });
    }

    // Calculate official amount in INR directly from verified order total paise
    const amountInRupees = Number((order.total_paise / 100).toFixed(2));

    // Construct the absolute redirect URL for payment return
    const siteUrl =
      process.env.VITE_PUBLIC_SITE_URL ||
      process.env.PUBLIC_SITE_URL ||
      (req.headers['x-forwarded-host']
        ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host']}`
        : req.headers.host
        ? `https://${req.headers.host}`
        : 'https://vyapaarpro.com');

    const redirectUrl = `${siteUrl.replace(/\/+$/, '')}/store/payment-result?order_id=${encodeURIComponent(order.id)}`;

    // Update status to PAYMENT_PENDING
    await supabase
      .from('store_orders')
      .update({
        status: 'PAYMENT_PENDING',
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    // 2. FamGateway API Key from server-side environment
    const famApiKey = process.env.FAMGATEWAY_API_KEY;

    let paymentUrl = '';
    let gatewayOrderId = '';
    let rawResponseData: any = null;

    if (famApiKey) {
      // Official documented endpoint: https://famgateway.in/api/create-order.php
      const famEndpoint = 'https://famgateway.in/api/create-order.php';

      const gatewayPayload = {
        amount: amountInRupees,
        redirect_url: redirectUrl,
      };

      console.log('[payment/create] calling FamGateway API', { amount: amountInRupees });

      try {
        const gatewayRes = await fetch(famEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${famApiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(gatewayPayload),
        });

        const rawText = await gatewayRes.text();
        try {
          rawResponseData = JSON.parse(rawText);
        } catch {
          rawResponseData = { rawText };
        }

        console.log('[payment/create] FamGateway response status:', gatewayRes.status);

        if (gatewayRes.ok && rawResponseData) {
          paymentUrl =
            rawResponseData.response?.data?.checkout_url ||
            rawResponseData.data?.checkout_url ||
            rawResponseData.checkout_url ||
            rawResponseData.response?.data?.payment_url ||
            rawResponseData.data?.payment_url ||
            rawResponseData.payment_url ||
            rawResponseData.url ||
            rawResponseData.link ||
            '';

          gatewayOrderId =
            rawResponseData.response?.data?.order_id ||
            rawResponseData.data?.order_id ||
            rawResponseData.order_id ||
            rawResponseData.id ||
            rawResponseData.transaction_id ||
            '';
        } else {
          console.error('[payment/create] FamGateway API error:', {
            status: gatewayRes.status,
            message: rawResponseData?.message || rawResponseData?.error || 'Unknown gateway error',
          });
          return res.status(502).json({
            error:
              rawResponseData?.message ||
              rawResponseData?.error ||
              'FamGateway returned an error while generating payment session.',
            details: rawResponseData,
          });
        }
      } catch (networkErr: any) {
        console.error('[payment/create] FamGateway network error:', networkErr?.message || networkErr);
        return res.status(502).json({
          error: 'Could not connect to FamGateway server. Please check your network and API key.',
        });
      }
    } else {
      console.warn('[payment/create] FAMGATEWAY_API_KEY is not configured');
      return res.status(503).json({
        error:
          'FAMGATEWAY_API_KEY is not configured in environment variables. Please configure your FamGateway API Key.',
      });
    }

    // 3. Record payment initiation in store_payments
    if (gatewayOrderId || paymentUrl) {
      await supabase.from('store_payments').insert({
        order_id: order.id,
        gateway: 'famgateway',
        gateway_order_id: gatewayOrderId || null,
        amount_paise: order.total_paise,
        currency: 'INR',
        status: 'PENDING',
        raw_reference_metadata: {
          famGatewayOrderCreated: true,
          amount: amountInRupees,
          redirect_url: redirectUrl,
          response: rawResponseData,
          createdAt: new Date().toISOString(),
        },
      });
    }

    console.log('[payment/create] response generated successfully', {
      hasPaymentUrl: !!paymentUrl,
      hasGatewayOrderId: !!gatewayOrderId,
    });

    return res.status(200).json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      amount: amountInRupees,
      paymentUrl: paymentUrl || redirectUrl,
      gatewayOrderId,
    });
  } catch (err: any) {
    console.error('[payment/create] unhandled error:', err?.message || err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
