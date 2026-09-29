import { createClient } from '@supabase/supabase-js';
import { getCachedOrder, cacheOrder } from './order-store';

/**
 * FamGateway Create Order Serverless API Endpoint
 *
 * Calls the official FamGateway endpoint:
 * POST https://famgateway.in/api/create-order.php
 */
export default async function handler(req: any, res: any) {
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

    // 1. Fetch order directly from database or server memory cache
    let order: any = null;

    if (supabase) {
      try {
        const { data: dbOrder } = await supabase
          .from('store_orders')
          .select('*')
          .or(`id.eq.${orderId},order_number.eq.${orderId}`)
          .single();

        if (dbOrder) {
          order = dbOrder;
        }
      } catch (err) {
        // Fallback to cache
      }
    }

    if (!order) {
      order = getCachedOrder(orderId);
    }

    if (!order && body.order && typeof body.order === 'object' && body.order.total_paise) {
      order = body.order;
      cacheOrder(order);
    }

    if (!order) {
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
    if (supabase) {
      try {
        await supabase
          .from('store_orders')
          .update({
            status: 'PAYMENT_PENDING',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);
      } catch (e) {
        // Safe notice
      }
    }

    order.status = 'PAYMENT_PENDING';
    cacheOrder(order);

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
          console.error('FamGateway API error response:', rawResponseData);
          return res.status(502).json({
            error:
              rawResponseData?.message ||
              rawResponseData?.error ||
              'FamGateway returned an error while generating payment session.',
            details: rawResponseData,
          });
        }
      } catch (networkErr: any) {
        console.error('FamGateway network error:', networkErr);
        return res.status(502).json({
          error: 'Could not connect to FamGateway server. Please check your network and API key.',
        });
      }
    } else {
      // Demo / Test gateway mode for development/preview when live key is not supplied
      gatewayOrderId = `fg_demo_${Date.now()}`;
      paymentUrl = `${redirectUrl}&status=success&demo=1`;
      rawResponseData = {
        demoMode: true,
        message: 'FAMGATEWAY_API_KEY not set - routed to demo test checkout',
      };
    }

    // 3. Record payment initiation in store_payments
    if ((gatewayOrderId || paymentUrl) && supabase) {
      try {
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
      } catch (e) {
        // Safe notice
      }
    }

    return res.status(200).json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      amount: amountInRupees,
      paymentUrl: paymentUrl || redirectUrl,
      gatewayOrderId,
    });
  } catch (err: any) {
    console.error('create-order error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
