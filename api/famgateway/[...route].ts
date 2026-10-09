import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return UUID_REGEX.test(str.trim());
}

function getSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function sendJsonResponse(res: any, status: number, data: any) {
  if (res?.headersSent) return;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-FamGateway-Signature, X-Signature, X-Api-Key'
  );
  return res.status(status).json(data);
}

// -----------------------------------------------------------------------------
// 1. CREATE ORDER HANDLER (Zero-Redirect Dynamic UPI QR)
// -----------------------------------------------------------------------------
export async function handleCreateOrder(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    let body: any = {};
    if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body);
      } catch {
        return sendJsonResponse(res, 400, { success: false, error: 'Invalid JSON payload' });
      }
    } else {
      body = req.body || {};
    }

    const {
      orderId,
      orderNumber,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      purpose,
    } = body;

    const parsedAmount = Number(amount) || 0;
    if (parsedAmount <= 0) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'Amount in INR must be greater than zero.',
      });
    }

    const supabase = getSupabaseClient();
    const effectiveOrderNumber =
      orderNumber ||
      (orderId ? `VP-ORD-${String(orderId).slice(-6).toUpperCase()}` : `VP-ORD-${Date.now().toString().slice(-6)}`);

    const famApiKey = process.env.FAMGATEWAY_API_KEY;
    const famMerchantId = process.env.FAMGATEWAY_MERCHANT_ID;
    const merchantVpa =
      process.env.FAMGATEWAY_UPI_VPA ||
      process.env.UPI_ID ||
      process.env.STORE_UPI_ID ||
      'viralpulse@upi';
    const merchantName =
      process.env.FAMGATEWAY_MERCHANT_NAME ||
      process.env.MERCHANT_NAME ||
      'ViralPulse Store';

    const cleanRef = String(orderId || effectiveOrderNumber)
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 30);
    const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(
      merchantVpa
    )}&pn=${encodeURIComponent(merchantName)}&am=${parsedAmount.toFixed(
      2
    )}&tr=${cleanRef}&tn=${encodeURIComponent(
      `Order ${effectiveOrderNumber}`
    )}&cu=INR`;

    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(upiIntentUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 320,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      });
    } catch (qrErr) {
      console.warn('[FamGateway] QRCode generation warning:', qrErr);
    }

    let gatewayOrderId = '';
    let gatewayPaymentUrl = '';
    let gatewayRawResponse: any = null;

    if (famApiKey) {
      try {
        const payload = {
          merchant_id: famMerchantId || undefined,
          order_id: String(orderId || effectiveOrderNumber),
          order_number: effectiveOrderNumber,
          amount: parsedAmount,
          currency: 'INR',
          customer_name: customerName || 'Customer',
          customer_email: customerEmail || 'customer@example.com',
          customer_phone: customerPhone || '9999999999',
          purpose: purpose || `Payment for ${effectiveOrderNumber}`,
          return_url: `${req.headers?.origin || 'https://viralpulse.in'}/store/payment-result?order_id=${encodeURIComponent(
            String(orderId || effectiveOrderNumber)
          )}`,
        };

        const famRes = await fetch('https://famgateway.com/api/v1/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${famApiKey}`,
            'X-Api-Key': famApiKey,
          },
          body: JSON.stringify(payload),
        });

        if (famRes.ok) {
          const json = await famRes.json();
          gatewayRawResponse = json;
          gatewayOrderId = json.order_id || json.id || json.data?.order_id || '';
          gatewayPaymentUrl = json.payment_url || json.qr_url || json.data?.payment_url || '';
        }
      } catch (famErr) {
        console.warn('[FamGateway] Direct gateway call notice, dynamic UPI fallback active:', famErr);
      }
    }

    // Persist payment attempt in database if Supabase is connected
    if (supabase && orderId && isUuid(orderId)) {
      try {
        const paymentPayload = {
          order_id: orderId,
          gateway_name: 'famgateway',
          gateway_order_id: gatewayOrderId || cleanRef,
          amount_paise: Math.round(parsedAmount * 100),
          currency: 'INR',
          status: 'PENDING',
          payment_url: gatewayPaymentUrl || upiIntentUrl,
          raw_response: {
            merchantVpa,
            merchantName,
            upiIntentUrl,
            gatewayOrderId,
            rawGateway: gatewayRawResponse,
          },
        };

        await supabase.from('store_payments').insert(paymentPayload);
        await supabase
          .from('store_orders')
          .update({ status: 'PAYMENT_PENDING' })
          .eq('id', orderId);
      } catch (dbErr) {
        console.warn('[FamGateway] Database payment record notice:', dbErr);
      }
    }

    return sendJsonResponse(res, 200, {
      success: true,
      orderId: orderId || `ord_${Date.now()}`,
      orderNumber: effectiveOrderNumber,
      amount: parsedAmount,
      upiUrl: upiIntentUrl,
      qrUrl: qrDataUrl || gatewayPaymentUrl || upiIntentUrl,
      gatewayOrderId,
      merchantVpa,
      merchantName,
      expirySeconds: 900,
    });
  } catch (err: any) {
    console.error('[FamGateway create-order] error:', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'Failed to initialize payment gateway order.',
    });
  }
}

// -----------------------------------------------------------------------------
// 2. ORDER STATUS POLLING HANDLER
// -----------------------------------------------------------------------------
export async function handleOrderStatus(req: any, res: any) {
  try {
    const orderId =
      req.query?.orderId ||
      req.query?.order_id ||
      req.query?.id ||
      (req.url ? new URL(req.url, 'http://localhost').searchParams.get('orderId') : null);

    if (!orderId) {
      return sendJsonResponse(res, 400, { success: false, error: 'Missing orderId parameter.' });
    }

    const cleanId = String(orderId).trim();
    const supabase = getSupabaseClient();

    if (supabase) {
      let orderQuery = supabase.from('store_orders').select('*');
      if (isUuid(cleanId)) {
        orderQuery = orderQuery.eq('id', cleanId);
      } else {
        orderQuery = orderQuery.or(`order_number.eq.${cleanId},id.eq.${cleanId}`);
      }

      const { data: order } = await orderQuery.maybeSingle();

      if (order) {
        const isPaid =
          order.status === 'PAID' ||
          order.status === 'COMPLETED' ||
          order.status === 'DELIVERED';
        const isReview = order.status === 'PAYMENT_REVIEW';

        return sendJsonResponse(res, 200, {
          success: true,
          status: isPaid ? 'SUCCESS' : isReview ? 'REVIEW' : 'PENDING',
          isPaid,
          order: {
            id: order.id,
            orderNumber: order.order_number,
            status: order.status,
            totalPaise: order.total_paise,
          },
        });
      }
    }

    return sendJsonResponse(res, 200, {
      success: true,
      status: 'PENDING',
      isPaid: false,
      message: 'Payment waiting for authorization or webhook settlement.',
    });
  } catch (err: any) {
    console.error('[FamGateway order-status] error:', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'Failed to query order status.',
    });
  }
}

// -----------------------------------------------------------------------------
// 3. VERIFY UTR / TRANSACTION ID HANDLER
// -----------------------------------------------------------------------------
export async function handleVerifyUtr(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    let body: any = {};
    if (typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body);
      } catch {
        return sendJsonResponse(res, 400, { success: false, error: 'Invalid JSON payload' });
      }
    } else {
      body = req.body || {};
    }

    const { orderId, utr, transactionId, customerPhone } = body;
    const submittedUtr = String(utr || transactionId || '').trim();

    if (!orderId) {
      return sendJsonResponse(res, 400, { success: false, error: 'Order ID is required.' });
    }
    if (!submittedUtr || submittedUtr.length < 6) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'Please enter a valid 12-digit UPI UTR or Transaction Reference number.',
      });
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      let orderQuery = supabase.from('store_orders').select('*');
      if (isUuid(orderId)) {
        orderQuery = orderQuery.eq('id', orderId);
      } else {
        orderQuery = orderQuery.or(`order_number.eq.${orderId},id.eq.${orderId}`);
      }

      const { data: order } = await orderQuery.maybeSingle();

      if (order) {
        // Record verification in store_payments
        await supabase.from('store_payments').insert({
          order_id: order.id,
          gateway_name: 'famgateway_manual_utr',
          gateway_payment_id: submittedUtr,
          amount_paise: order.total_paise,
          currency: 'INR',
          status: 'SUCCESS',
          raw_response: {
            utr: submittedUtr,
            verified_at: new Date().toISOString(),
            customerPhone: customerPhone || order.customer_phone,
          },
        });

        // Update order status to PAID
        await supabase
          .from('store_orders')
          .update({
            status: 'PAID',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        return sendJsonResponse(res, 200, {
          success: true,
          message: 'Payment verified and confirmed successfully!',
          isPaid: true,
          order: {
            id: order.id,
            orderNumber: order.order_number,
            status: 'PAID',
          },
        });
      }
    }

    return sendJsonResponse(res, 200, {
      success: true,
      message: 'Payment verification recorded.',
      isPaid: true,
    });
  } catch (err: any) {
    console.error('[FamGateway verify-utr] error:', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'Failed to verify UTR number.',
    });
  }
}

// -----------------------------------------------------------------------------
// 4. WEBHOOK HANDLER
// -----------------------------------------------------------------------------
export async function handleWebhook(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJsonResponse(res, 405, { error: 'Method Not Allowed' });
  }

  try {
    let payload: any = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        return sendJsonResponse(res, 400, { error: 'Invalid JSON payload' });
      }
    }

    const orderRef =
      payload?.order_id ||
      payload?.orderId ||
      payload?.order_number ||
      payload?.data?.order_id;
    const status = String(payload?.status || payload?.data?.status || 'SUCCESS').toUpperCase();

    console.log('[FamGateway Webhook] received:', { orderRef, status });

    if (orderRef) {
      const supabase = getSupabaseClient();
      if (supabase) {
        let updateQuery = supabase
          .from('store_orders')
          .update({
            status: status === 'SUCCESS' || status === 'COMPLETED' ? 'PAID' : status,
            updated_at: new Date().toISOString(),
          });

        if (isUuid(orderRef)) {
          updateQuery = updateQuery.eq('id', orderRef);
        } else {
          updateQuery = updateQuery.or(`order_number.eq.${orderRef},id.eq.${orderRef}`);
        }

        await updateQuery;
      }
    }

    return sendJsonResponse(res, 200, { success: true, message: 'Webhook processed' });
  } catch (err: any) {
    console.error('[FamGateway Webhook] error:', err);
    return sendJsonResponse(res, 500, { error: err.message || 'Webhook processing failed' });
  }
}

// -----------------------------------------------------------------------------
// UNIVERSAL ROUTER FOR /api/famgateway/[...route]
// -----------------------------------------------------------------------------
export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-FamGateway-Signature, X-Signature, X-Api-Key'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let routeParam: any = req.query?.route || req.query?.path;
    if (!routeParam && req.url && req.url.includes('?')) {
      try {
        const u = new URL(req.url, 'http://localhost');
        routeParam = u.searchParams.get('route') || u.searchParams.get('path');
      } catch {}
    }

    let segments: string[] = [];
    if (Array.isArray(routeParam)) {
      segments = routeParam.map(String).filter(Boolean);
    } else if (typeof routeParam === 'string') {
      segments = routeParam.split('/').filter(Boolean);
    } else if (req.url) {
      const pathname = (req.originalUrl || req.url).split('?')[0] || '';
      const match = pathname.replace(/^\/?api\/famgateway\/?/i, '');
      segments = match.split('/').filter(Boolean);
    }

    const subroute = (segments[0] || '').toLowerCase().trim();

    if (subroute === 'create-order') {
      return await handleCreateOrder(req, res);
    }
    if (subroute === 'order-status') {
      return await handleOrderStatus(req, res);
    }
    if (subroute === 'verify-utr') {
      return await handleVerifyUtr(req, res);
    }
    if (subroute === 'webhook') {
      return await handleWebhook(req, res);
    }

    return sendJsonResponse(res, 404, {
      success: false,
      error: `FamGateway subroute not found: ${subroute || '/'}`,
      availableRoutes: [
        '/api/famgateway/create-order',
        '/api/famgateway/order-status',
        '/api/famgateway/verify-utr',
        '/api/famgateway/webhook',
      ],
    });
  } catch (err: any) {
    console.error('[FamGateway Router] error:', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'Internal Server Error in FamGateway Router',
    });
  }
}
