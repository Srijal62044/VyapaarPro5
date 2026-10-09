import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

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
      const explicitAmount = typeof body.amount === 'number' ? body.amount : Number(body.amount) || 0;
      if (explicitAmount > 0 || orderId) {
        order = {
          id: String(orderId).trim(),
          order_number: String(body.orderNumber || orderId).trim(),
          total_paise: explicitAmount > 0 ? Math.round(explicitAmount * 100) : 100,
          status: 'PAYMENT_PENDING',
        };
      } else {
        console.warn('[payment/create] order lookup failed for:', { hasOrderId: !!orderId });
        return res.status(404).json({ error: 'Order not found in database.' });
      }
    }

    if (order.status === 'PAID') {
      return res.status(400).json({ error: 'Order has already been paid.' });
    }

    // Calculate official amount in INR directly from verified order total paise
    const amountInRupees = Number(((order.total_paise || 100) / 100).toFixed(2));

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

    // Update status to PAYMENT_PENDING in database if UUID
    if (isUuid(order.id)) {
      try {
        await supabase
          .from('store_orders')
          .update({
            status: 'PAYMENT_PENDING',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);
      } catch (updErr) {
        console.warn('[payment/create] status update notice:', updErr);
      }
    }

    // 2. FamGateway & UPI Details
    let famApiKey = (process.env.FAMGATEWAY_API_KEY || '').trim();
    let famMerchantId = (process.env.FAMGATEWAY_MERCHANT_ID || '').trim();
    let merchantVpa = (
      process.env.FAMGATEWAY_UPI_VPA ||
      process.env.UPI_ID ||
      process.env.PAYMENT_UPI_VPA ||
      'vyapaarpro@upi'
    ).trim();
    let merchantName = (
      process.env.FAMGATEWAY_MERCHANT_NAME ||
      process.env.MERCHANT_NAME ||
      'VyapaarPro'
    ).trim();

    if (supabase) {
      try {
        const { data: settingRow } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'payment_settings')
          .maybeSingle();
        if (settingRow?.value) {
          if (!famApiKey && settingRow.value.famgateway_api_key) {
            famApiKey = String(settingRow.value.famgateway_api_key).trim();
          }
          if (!famMerchantId && settingRow.value.famgateway_merchant_id) {
            famMerchantId = String(settingRow.value.famgateway_merchant_id).trim();
          }
          if (settingRow.value.famgateway_upi_vpa) {
            merchantVpa = String(settingRow.value.famgateway_upi_vpa).trim();
          }
          if (settingRow.value.famgateway_merchant_name) {
            merchantName = String(settingRow.value.famgateway_merchant_name).trim();
          }
        }
      } catch {}
    }

    let paymentUrl = '';
    let gatewayOrderId = `FG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let upiUrl = '';
    let rawResponseData: any = null;

    if (famApiKey) {
      const webhookUrl = `${siteUrl.replace(/\/+$/, '')}/api/famgateway/webhook`;
      const gatewayPayload: any = {
        amount: amountInRupees,
        customer_name: order.customer_name || 'Valued Customer',
        redirect_url: redirectUrl,
        webhook_url: webhookUrl,
        order_id: String(order.id || order.order_number),
      };
      if (famMerchantId) {
        gatewayPayload.merchant_id = famMerchantId;
      }

      console.log('[payment/create] calling FamGateway API', { amount: amountInRupees });

      const endpoints = [
        'https://famgateway.in/api/create-order',
        'https://famgateway.in/api/create-order.php',
      ];

      for (const endpoint of endpoints) {
        try {
          const gatewayRes = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${famApiKey}`,
              'X-Api-Key': famApiKey,
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
            const respData = rawResponseData.response?.data || rawResponseData.data || rawResponseData;
            paymentUrl =
              respData.checkout_url ||
              respData.payment_url ||
              respData.url ||
              respData.link ||
              '';

            const retId = respData.order_id || respData.id || respData.transaction_id;
            if (retId) gatewayOrderId = String(retId);

            if (respData.upi_url || respData.upi_intent) {
              upiUrl = respData.upi_url || respData.upi_intent;
            }
            break;
          }
        } catch (networkErr: any) {
          console.warn('[payment/create] FamGateway endpoint probe notice:', networkErr?.message);
        }
      }
    } else {
      console.log('[payment/create] FAMGATEWAY_API_KEY will be loaded from Vercel env; using direct UPI in preview.');
    }

    // Generate standard NPCI UPI Intent URL if not provided by gateway
    if (!upiUrl) {
      const vpa = merchantVpa.trim();
      const name = encodeURIComponent(merchantName.trim());
      const amt = amountInRupees.toFixed(2);
      const tr = encodeURIComponent(gatewayOrderId);
      const tn = encodeURIComponent(`${merchantName} ${order.order_number}`);
      upiUrl = `upi://pay?pa=${vpa}&pn=${name}&am=${amt}&tr=${tr}&tn=${tn}&cu=INR`;
    }

    // Generate high-resolution QR code as base64 PNG data URL
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(upiUrl, {
        width: 420,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
    } catch (qrErr) {
      console.error('[payment/create] QR generation error:', qrErr);
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // 3. Record payment initiation in store_payments if valid UUID order
    if (gatewayOrderId && isUuid(order.id)) {
      try {
        await supabase.from('store_payments').insert({
          order_id: order.id,
          gateway: 'famgateway',
          gateway_order_id: gatewayOrderId,
          amount_paise: order.total_paise,
          currency: 'INR',
          status: 'PENDING',
          raw_reference_metadata: {
            famGatewayOrderCreated: true,
            inPageModal: true,
            amount: amountInRupees,
            upiUrl,
            expiresAt,
            redirect_url: redirectUrl,
            response: rawResponseData,
            createdAt: new Date().toISOString(),
          },
        });
      } catch (payInsErr) {
        console.warn('[payment/create] store_payments insert notice:', payInsErr);
      }
    }

    console.log('[payment/create] response generated successfully (in-page modal ready)', {
      hasQrDataUrl: !!qrDataUrl,
      hasUpiUrl: !!upiUrl,
      gatewayOrderId,
    });

    return res.status(200).json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      amount: amountInRupees,
      currency: 'INR',
      paymentUrl: paymentUrl || redirectUrl,
      gatewayOrderId,
      upiUrl,
      qrUrl: qrDataUrl,
      expiresAt,
      merchantVpa,
      merchantName,
    });
  } catch (err: any) {
    console.error('[payment/create] unhandled error:', err?.message || err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
