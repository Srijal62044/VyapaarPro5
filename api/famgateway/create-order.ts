import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return UUID_REGEX.test(str.trim());
}

/**
 * Generate standard Indian NPCI UPI Intent Link
 * upi://pay?pa={vpa}&pn={name}&am={amount}&tr={ref}&tn={note}&cu=INR
 */
function buildUpiIntentUrl(params: {
  vpa: string;
  name: string;
  amount: number;
  transactionRef: string;
  note?: string;
}): string {
  const vpa = params.vpa.trim();
  const name = encodeURIComponent(params.name.trim());
  const amount = params.amount.toFixed(2);
  const tr = encodeURIComponent(params.transactionRef.trim());
  const tn = encodeURIComponent(params.note || `Order ${params.transactionRef}`);
  return `upi://pay?pa=${vpa}&pn=${name}&am=${amount}&tr=${tr}&tn=${tn}&cu=INR`;
}

/**
 * FamGateway Create Order Endpoint (In-Page Zero Redirect Flow)
 * POST /api/famgateway/create-order
 *
 * Creates a payment order, contacts FamGateway if configured,
 * generates dynamic UPI intent and high-contrast in-page QR code data URL.
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

    const orderId = body.orderId || body.order_id || body.id;
    const explicitAmount = typeof body.amount === 'number' ? body.amount : Number(body.amount) || 0;
    const customerName = body.customerName || body.name || 'Customer';
    const customerPhone = body.customerPhone || body.phone || '';
    const purpose = body.purpose || 'store_order';

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

    let order: any = null;
    let amountInRupees = explicitAmount;
    let orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    // 1. Look up existing store order if orderId provided
    if (orderId && supabase) {
      if (isUuid(orderId)) {
        const { data: orderById } = await supabase
          .from('store_orders')
          .select('*')
          .eq('id', orderId)
          .maybeSingle();
        if (orderById) order = orderById;
      }

      if (!order) {
        const { data: orderByNum } = await supabase
          .from('store_orders')
          .select('*')
          .eq('order_number', String(orderId).trim())
          .maybeSingle();
        if (orderByNum) order = orderByNum;
      }

      if (order) {
        amountInRupees = Number((order.total_paise / 100).toFixed(2));
        orderNumber = order.order_number || orderNumber;
      }
    }

    if (amountInRupees <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required.' });
    }

    // 2. Resolve Merchant details
    const merchantVpa =
      process.env.FAMGATEWAY_UPI_VPA ||
      process.env.UPI_ID ||
      process.env.PAYMENT_UPI_VPA ||
      'vyapaarpro@upi';
    const merchantName =
      process.env.FAMGATEWAY_MERCHANT_NAME ||
      process.env.MERCHANT_NAME ||
      'VyapaarPro';

    const siteUrl =
      process.env.VITE_PUBLIC_SITE_URL ||
      process.env.PUBLIC_SITE_URL ||
      (req.headers['x-forwarded-host']
        ? `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host']}`
        : req.headers.host
        ? `https://${req.headers.host}`
        : 'https://vyapaarpro.com');

    const redirectUrl = `${siteUrl.replace(/\/+$/, '')}/store/payment-result?order_id=${encodeURIComponent(order?.id || orderNumber)}`;

    // 3. FamGateway API Key from environment (configured on Vercel)
    const famApiKey = process.env.FAMGATEWAY_API_KEY;
    const famMerchantId = process.env.FAMGATEWAY_MERCHANT_ID;

    let gatewayOrderId = `FG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let upiUrl = '';
    let rawGatewayResponse: any = null;

    if (famApiKey) {
      const famEndpoint = 'https://famgateway.in/api/create-order.php';
      const gatewayPayload: any = {
        amount: amountInRupees,
        redirect_url: redirectUrl,
      };
      if (famMerchantId) {
        gatewayPayload.merchant_id = famMerchantId;
      }

      try {
        console.log('[famgateway/create-order] Calling FamGateway API...', { amount: amountInRupees });
        const gwRes = await fetch(famEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${famApiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(gatewayPayload),
        });

        const rawText = await gwRes.text();
        try {
          rawGatewayResponse = JSON.parse(rawText);
        } catch {
          rawGatewayResponse = { rawText };
        }

        console.log('[famgateway/create-order] FamGateway status:', gwRes.status);

        if (gwRes.ok && rawGatewayResponse) {
          const respData = rawGatewayResponse.response?.data || rawGatewayResponse.data || rawGatewayResponse;
          const returnedId = respData.order_id || respData.id || respData.transaction_id;
          if (returnedId) gatewayOrderId = String(returnedId);

          if (respData.upi_url || respData.upi_intent) {
            upiUrl = respData.upi_url || respData.upi_intent;
          }
        }
      } catch (networkErr: any) {
        console.warn('[famgateway/create-order] Gateway network notice, continuing with direct UPI:', networkErr?.message);
      }
    }

    // 4. If gateway didn't provide a direct UPI URL, construct the standard NPCI UPI URL
    if (!upiUrl) {
      upiUrl = buildUpiIntentUrl({
        vpa: merchantVpa,
        name: merchantName,
        amount: amountInRupees,
        transactionRef: gatewayOrderId,
        note: `${merchantName} ${orderNumber}`,
      });
    }

    // 5. Generate high-contrast, scan-friendly QR code as base64 PNG data URL
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
      console.error('[famgateway/create-order] QR generation error:', qrErr);
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes window

    // 6. Update database records if Supabase is active
    if (order && supabase && isUuid(order.id)) {
      try {
        await supabase
          .from('store_orders')
          .update({
            status: 'PAYMENT_PENDING',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        await supabase.from('store_payments').insert({
          order_id: order.id,
          gateway: 'famgateway',
          gateway_order_id: gatewayOrderId,
          amount_paise: Math.round(amountInRupees * 100),
          currency: 'INR',
          status: 'PENDING',
          raw_reference_metadata: {
            inPageModal: true,
            purpose,
            customerName,
            customerPhone,
            amount: amountInRupees,
            upiUrl,
            expiresAt,
            gatewayResponse: rawGatewayResponse,
            createdAt: new Date().toISOString(),
          },
        });
      } catch (dbErr) {
        console.warn('[famgateway/create-order] DB payment record notice:', dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      orderId: order?.id || orderId || gatewayOrderId,
      orderNumber,
      amount: amountInRupees,
      currency: 'INR',
      gatewayOrderId,
      upiUrl,
      qrUrl: qrDataUrl,
      merchantVpa,
      merchantName,
      expiresAt,
      purpose,
    });
  } catch (err: any) {
    console.error('[famgateway/create-order] error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
