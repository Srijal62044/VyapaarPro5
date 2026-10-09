import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import crypto from 'crypto';

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

/**
 * Retrieves FamGateway configuration with priority:
 * 1. Process environment variables (e.g. Vercel dashboard)
 * 2. Supabase database 'settings' table under key 'payment_settings'
 */
async function getFamGatewayConfig(supabase: any) {
  let apiKey = (process.env.FAMGATEWAY_API_KEY || '').trim();
  let merchantId = (process.env.FAMGATEWAY_MERCHANT_ID || '').trim();
  let upiVpa = (
    process.env.FAMGATEWAY_UPI_VPA ||
    process.env.UPI_ID ||
    process.env.STORE_UPI_ID ||
    'viralpulse@upi'
  ).trim();
  let merchantName = (
    process.env.FAMGATEWAY_MERCHANT_NAME ||
    process.env.MERCHANT_NAME ||
    'ViralPulse Store'
  ).trim();

  if (supabase) {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'payment_settings')
        .maybeSingle();

      if (data?.value) {
        if (!apiKey && data.value.famgateway_api_key) {
          apiKey = String(data.value.famgateway_api_key).trim();
        }
        if (!merchantId && data.value.famgateway_merchant_id) {
          merchantId = String(data.value.famgateway_merchant_id).trim();
        }
        if (data.value.famgateway_upi_vpa) {
          upiVpa = String(data.value.famgateway_upi_vpa).trim();
        }
        if (data.value.famgateway_merchant_name) {
          merchantName = String(data.value.famgateway_merchant_name).trim();
        }
      }
    } catch (e) {
      // Non-blocking fallback
    }
  }

  return { apiKey, merchantId, upiVpa, merchantName };
}

/**
 * Query FamGateway via both official documented endpoints:
 * 1. /api/verify-order.php (server verification)
 * 2. /api/checkout-status.php (real-time checkout status)
 */
async function queryFamGatewayStatus(famApiKey: string, candidateIds: (string | null | undefined)[]) {
  if (!famApiKey) {
    return { verified: false, status: 'pending', utr: null, transactionId: null, raw: null };
  }

  const cleanIds = Array.from(new Set(candidateIds.map((id) => (id ? String(id).trim() : '')).filter(Boolean)));
  if (cleanIds.length === 0) {
    return { verified: false, status: 'pending', utr: null, transactionId: null, raw: null };
  }

  for (const candidateId of cleanIds) {
    // 1. Try official verify-order.php
    try {
      const verifyUrl = `https://famgateway.in/api/verify-order.php?api_key=${encodeURIComponent(
        famApiKey
      )}&order_id=${encodeURIComponent(candidateId)}`;

      const gwRes = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'X-Api-Key': famApiKey,
          Authorization: `Bearer ${famApiKey}`,
          Accept: 'application/json',
        },
      });

      if (gwRes.ok) {
        const gwData = await gwRes.json();
        const gwStatus = String(gwData.status || gwData.data?.status || '').toLowerCase().trim();

        if (gwStatus === 'success' || gwStatus === 'completed' || gwStatus === 'paid') {
          const utr = gwData.data?.utr || gwData.utr || null;
          const transactionId =
            gwData.data?.transaction_id ||
            gwData.transaction_id ||
            gwData.data?.order_id ||
            candidateId;

          return {
            verified: true,
            status: 'success',
            utr,
            transactionId,
            raw: gwData,
          };
        }
      }
    } catch (err) {
      // Continue to next probe
    }

    // 2. Try official checkout-status.php
    try {
      const statusUrl = `https://famgateway.in/api/checkout-status.php?order_id=${encodeURIComponent(
        candidateId
      )}&api_key=${encodeURIComponent(famApiKey)}`;

      const gwRes = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'X-Api-Key': famApiKey,
          Accept: 'application/json',
        },
      });

      if (gwRes.ok) {
        const gwData = await gwRes.json();
        const gwStatus = String(gwData.status || gwData.data?.status || '').toLowerCase().trim();

        if (gwStatus === 'success' || gwStatus === 'completed' || gwStatus === 'paid') {
          const utr = gwData.data?.utr || gwData.utr || null;
          const transactionId =
            gwData.data?.transaction_id ||
            gwData.transaction_id ||
            gwData.data?.order_id ||
            candidateId;

          return {
            verified: true,
            status: 'success',
            utr,
            transactionId,
            raw: gwData,
          };
        }
      }
    } catch (err) {
      // Continue
    }
  }

  return { verified: false, status: 'pending', utr: null, transactionId: null, raw: null };
}

// -----------------------------------------------------------------------------
// 1. CREATE ORDER HANDLER (Zero-Redirect Dynamic UPI QR with FamGateway)
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

    const { apiKey: famApiKey, merchantId: famMerchantId, upiVpa: merchantVpa, merchantName } =
      await getFamGatewayConfig(supabase);

    const host =
      req.headers?.['x-forwarded-host'] ||
      req.headers?.host ||
      'localhost:3000';
    const proto = req.headers?.['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${proto}://${host}`;

    const redirectUrl = `${baseUrl}/store/payment-result?order_id=${encodeURIComponent(
      String(orderId || effectiveOrderNumber)
    )}`;
    const webhookUrl = `${baseUrl}/api/famgateway/webhook`;

    let gatewayOrderId = `FG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let dynamicUpiUrl = '';
    let gatewayPaymentUrl = '';
    let gatewayRawResponse: any = null;

    // Call FamGateway official create-order API
    if (famApiKey) {
      try {
        const payload: any = {
          amount: Number(parsedAmount.toFixed(2)),
          customer_name: customerName || 'Valued Customer',
          redirect_url: redirectUrl,
          webhook_url: webhookUrl,
          order_id: String(orderId || effectiveOrderNumber),
        };
        if (famMerchantId) {
          payload.merchant_id = famMerchantId;
        }

        const endpoints = [
          'https://famgateway.in/api/create-order',
          'https://famgateway.in/api/create-order.php',
        ];

        for (const endpoint of endpoints) {
          try {
            const famRes = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': famApiKey,
                Authorization: `Bearer ${famApiKey}`,
              },
              body: JSON.stringify(payload),
            });

            if (famRes.ok) {
              const json = await famRes.json();
              gatewayRawResponse = json;
              const respData = json.response?.data || json.data || json;

              if (respData.order_id || respData.id || respData.transaction_id) {
                gatewayOrderId = String(respData.order_id || respData.id || respData.transaction_id);
              }
              if (respData.upi_url || respData.upi_intent) {
                dynamicUpiUrl = respData.upi_url || respData.upi_intent;
              }
              if (respData.checkout_url || respData.payment_url) {
                gatewayPaymentUrl = respData.checkout_url || respData.payment_url;
              }
              break;
            }
          } catch (probeErr) {
            // Try next endpoint
          }
        }
      } catch (famErr) {
        console.warn('[FamGateway create-order] Gateway call notice:', famErr);
      }
    }

    // Fallback standard NPCI UPI Intent URL if gateway did not provide a dynamic upi_url
    if (!dynamicUpiUrl) {
      const cleanRef = String(gatewayOrderId || orderId || effectiveOrderNumber)
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 30);
      dynamicUpiUrl = `upi://pay?pa=${encodeURIComponent(
        merchantVpa
      )}&pn=${encodeURIComponent(merchantName)}&am=${parsedAmount.toFixed(
        2
      )}&tr=${cleanRef}&tn=${encodeURIComponent(
        `Order ${effectiveOrderNumber}`
      )}&cu=INR`;
    }

    // Generate high-resolution QR code
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(dynamicUpiUrl, {
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

    // Persist payment attempt in database if Supabase is connected
    if (supabase) {
      try {
        let dbOrderId = orderId;
        if (!isUuid(dbOrderId) && effectiveOrderNumber) {
          const { data: matchedOrder } = await supabase
            .from('store_orders')
            .select('id')
            .eq('order_number', effectiveOrderNumber)
            .maybeSingle();
          if (matchedOrder?.id) {
            dbOrderId = matchedOrder.id;
          }
        }

        if (dbOrderId && isUuid(dbOrderId)) {
          const paymentPayload = {
            order_id: dbOrderId,
            gateway_name: 'famgateway',
            gateway_order_id: gatewayOrderId,
            amount_paise: Math.round(parsedAmount * 100),
            currency: 'INR',
            status: 'PENDING',
            payment_url: gatewayPaymentUrl || dynamicUpiUrl,
            raw_response: {
              merchantVpa,
              merchantName,
              upiIntentUrl: dynamicUpiUrl,
              gatewayOrderId,
              rawGateway: gatewayRawResponse,
            },
          };

          await supabase.from('store_payments').insert(paymentPayload);
          await supabase
            .from('store_orders')
            .update({ status: 'PAYMENT_PENDING' })
            .eq('id', dbOrderId);
        }
      } catch (dbErr) {
        console.warn('[FamGateway] Database payment record notice:', dbErr);
      }
    }

    return sendJsonResponse(res, 200, {
      success: true,
      orderId: orderId || `ord_${Date.now()}`,
      orderNumber: effectiveOrderNumber,
      amount: parsedAmount,
      upiUrl: dynamicUpiUrl,
      qrUrl: qrDataUrl || dynamicUpiUrl,
      paymentUrl: gatewayPaymentUrl || dynamicUpiUrl,
      gatewayOrderId,
      merchantVpa,
      merchantName,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
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
// 2. AUTOMATIC ORDER STATUS POLLING & VERIFICATION HANDLER
// -----------------------------------------------------------------------------
export async function handleOrderStatus(req: any, res: any, pathOrderId?: string) {
  try {
    const orderId =
      pathOrderId ||
      req.params?.orderId ||
      req.query?.orderId ||
      req.query?.order_id ||
      req.query?.id ||
      (req.url ? new URL(req.url, 'http://localhost').searchParams.get('orderId') : null) ||
      (req.url ? new URL(req.url, 'http://localhost').searchParams.get('order_id') : null);

    if (!orderId) {
      return sendJsonResponse(res, 400, { success: false, error: 'Missing orderId parameter.' });
    }

    const cleanId = String(orderId).trim();
    const supabase = getSupabaseClient();
    const { apiKey: famApiKey } = await getFamGatewayConfig(supabase);

    if (supabase) {
      let orderQuery = supabase.from('store_orders').select('*');
      if (isUuid(cleanId)) {
        orderQuery = orderQuery.eq('id', cleanId);
      } else {
        orderQuery = orderQuery.or(`order_number.eq.${cleanId},id.eq.${cleanId}`);
      }

      const { data: order } = await orderQuery.maybeSingle();

      if (order) {
        // If already confirmed as PAID, immediately return SUCCESS
        if (
          order.status === 'PAID' ||
          order.status === 'COMPLETED' ||
          order.status === 'DELIVERED'
        ) {
          return sendJsonResponse(res, 200, {
            success: true,
            status: 'SUCCESS',
            isPaid: true,
            paid: true,
            order: {
              id: order.id,
              orderNumber: order.order_number,
              status: order.status,
              totalPaise: order.total_paise,
            },
            message: 'Payment has been confirmed.',
          });
        }

        // Active automatic verification: Check gateway if FamGateway API key is set
        if (famApiKey) {
          const { data: latestPayment } = await supabase
            .from('store_payments')
            .select('*')
            .eq('order_id', order.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const candidateIds = [
            latestPayment?.gateway_order_id,
            order.order_number,
            order.id,
            cleanId,
          ];

          const famResult = await queryFamGatewayStatus(famApiKey, candidateIds);

          if (famResult.verified) {
            const confirmedUtr = famResult.utr || famResult.transactionId || `TXN-${Date.now()}`;

            // Automatically update database to PAID
            await supabase
              .from('store_orders')
              .update({
                status: 'PAID',
                updated_at: new Date().toISOString(),
              })
              .eq('id', order.id);

            if (latestPayment?.id) {
              await supabase
                .from('store_payments')
                .update({
                  status: 'SUCCESS',
                  gateway_payment_id: famResult.transactionId || confirmedUtr,
                  gateway_reference: confirmedUtr,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', latestPayment.id);
            }

            return sendJsonResponse(res, 200, {
              success: true,
              status: 'SUCCESS',
              isPaid: true,
              paid: true,
              order: {
                id: order.id,
                orderNumber: order.order_number,
                status: 'PAID',
                totalPaise: order.total_paise,
              },
              utr: confirmedUtr,
              message: 'Payment verified automatically via FamGateway.',
            });
          }
        }

        return sendJsonResponse(res, 200, {
          success: true,
          status: 'PENDING',
          isPaid: false,
          paid: false,
          order: {
            id: order.id,
            orderNumber: order.order_number,
            status: order.status,
            totalPaise: order.total_paise,
          },
          message: 'Awaiting settlement authorization from UPI network.',
        });
      }
    }

    return sendJsonResponse(res, 200, {
      success: true,
      status: 'PENDING',
      isPaid: false,
      paid: false,
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
// 3. SECURE VERIFY HANDLER (Rejects Fake UTRs; Requires Gateway Confirmation)
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

    const { orderId, utr, transactionId } = body;
    const submittedUtr = String(utr || transactionId || '').trim();

    if (!orderId) {
      return sendJsonResponse(res, 400, { success: false, error: 'Order ID is required.' });
    }

    const cleanUtr = submittedUtr.replace(/[^a-zA-Z0-9]/g, '');
    if (!cleanUtr || cleanUtr.length < 6) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'Please enter a valid 12-digit UPI Reference Number / Bank UTR.',
      });
    }

    const supabase = getSupabaseClient();
    const { apiKey: famApiKey } = await getFamGatewayConfig(supabase);

    if (!supabase) {
      return sendJsonResponse(res, 500, { success: false, error: 'Database service unavailable.' });
    }

    let orderQuery = supabase.from('store_orders').select('*');
    if (isUuid(orderId)) {
      orderQuery = orderQuery.eq('id', orderId);
    } else {
      orderQuery = orderQuery.or(`order_number.eq.${orderId},id.eq.${orderId}`);
    }

    const { data: order } = await orderQuery.maybeSingle();

    if (!order) {
      return sendJsonResponse(res, 404, { success: false, error: 'Order not found.' });
    }

    if (order.status === 'PAID' || order.status === 'COMPLETED' || order.status === 'DELIVERED') {
      return sendJsonResponse(res, 200, {
        success: true,
        message: 'Payment already verified and confirmed!',
        isPaid: true,
        paid: true,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          status: 'PAID',
        },
      });
    }

    const { data: latestPayment } = await supabase
      .from('store_payments')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const candidateIds = [
      latestPayment?.gateway_order_id,
      order.order_number,
      order.id,
      orderId,
    ];

    // Check with FamGateway API - NEVER blindly trust user-submitted UTR!
    // A fake UTR will not have a corresponding settlement on FamGateway.
    const famResult = await queryFamGatewayStatus(famApiKey, candidateIds);

    if (famResult.verified) {
      const confirmedUtr = famResult.utr || cleanUtr || famResult.transactionId || `TXN-${Date.now()}`;

      await supabase
        .from('store_orders')
        .update({
          status: 'PAID',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (latestPayment?.id) {
        await supabase
          .from('store_payments')
          .update({
            status: 'SUCCESS',
            gateway_payment_id: famResult.transactionId || confirmedUtr,
            gateway_reference: confirmedUtr,
            updated_at: new Date().toISOString(),
          })
          .eq('id', latestPayment.id);
      }

      return sendJsonResponse(res, 200, {
        success: true,
        message: 'Payment verified and confirmed successfully!',
        isPaid: true,
        paid: true,
        order: {
          id: order.id,
          orderNumber: order.order_number,
          status: 'PAID',
        },
      });
    }

    // If FamGateway does not confirm the payment, REJECT IT! Fake UTRs will NOT pass!
    return sendJsonResponse(res, 400, {
      success: false,
      isPaid: false,
      paid: false,
      error:
        'Payment could not be verified by the banking gateway. If you just completed the payment, please allow 10–20 seconds for the bank to process and tap "Check Status" again. Fake or uncredited UTRs will not be accepted.',
    });
  } catch (err: any) {
    console.error('[FamGateway verify-utr] error:', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'Failed to verify transaction.',
    });
  }
}

// -----------------------------------------------------------------------------
// 4. WEBHOOK HANDLER (Instant Settlement from Gateway)
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

    const supabase = getSupabaseClient();
    const { apiKey: famApiKey } = await getFamGatewayConfig(supabase);

    // Verify HMAC-SHA256 signature if provided
    const signature = req.headers?.['x-famgateway-signature'] || req.headers?.['x-signature'];
    if (signature && famApiKey && typeof req.body === 'string') {
      try {
        const expectedSig = crypto
          .createHmac('sha256', famApiKey)
          .update(req.body)
          .digest('hex');
        if (signature !== expectedSig) {
          console.warn('[FamGateway Webhook] Invalid signature received.');
          return sendJsonResponse(res, 401, { error: 'Invalid HMAC signature' });
        }
      } catch (sigErr) {
        console.warn('[FamGateway Webhook] Signature verification notice:', sigErr);
      }
    }

    const orderRef =
      payload?.order_id ||
      payload?.orderId ||
      payload?.order_number ||
      payload?.data?.order_id;
    const rawStatus = String(payload?.status || payload?.data?.status || 'SUCCESS').toUpperCase();
    const utr = payload?.data?.utr || payload?.utr || null;
    const txnId = payload?.data?.transaction_id || payload?.transaction_id || `TXN-${Date.now()}`;

    console.log('[FamGateway Webhook] received:', { orderRef, rawStatus, utr });

    if (orderRef && supabase) {
      const isSuccess = rawStatus === 'SUCCESS' || rawStatus === 'COMPLETED' || rawStatus === 'PAID';
      const finalStatus = isSuccess ? 'PAID' : rawStatus;

      let updateQuery = supabase
        .from('store_orders')
        .update({
          status: finalStatus,
          updated_at: new Date().toISOString(),
        });

      if (isUuid(orderRef)) {
        updateQuery = updateQuery.eq('id', orderRef);
      } else {
        updateQuery = updateQuery.or(`order_number.eq.${orderRef},id.eq.${orderRef}`);
      }

      await updateQuery;

      if (isSuccess) {
        let payQuery = supabase
          .from('store_payments')
          .update({
            status: 'SUCCESS',
            gateway_payment_id: txnId,
            gateway_reference: utr || txnId,
            updated_at: new Date().toISOString(),
          });

        if (isUuid(orderRef)) {
          payQuery = payQuery.eq('order_id', orderRef);
        } else {
          payQuery = payQuery.eq('gateway_order_id', orderRef);
        }
        await payQuery;
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
    const secondSegment = segments[1] || '';

    if (subroute === 'create-order') {
      return await handleCreateOrder(req, res);
    }
    if (subroute === 'order-status') {
      return await handleOrderStatus(req, res, secondSegment);
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
