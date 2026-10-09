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

    let gatewayOrderId = `FG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let gatewayPaymentUrl = '';
    let gatewayRawResponse: any = null;

    if (famApiKey) {
      try {
        const payload: any = {
          amount: parsedAmount,
          redirect_url: `${req.headers?.origin || 'https://viralpulse.in'}/store/payment-result?order_id=${encodeURIComponent(
            String(orderId || effectiveOrderNumber)
          )}`,
          order_id: String(orderId || effectiveOrderNumber),
        };
        if (famMerchantId) {
          payload.merchant_id = famMerchantId;
        }

        // Official documented FamGateway create order endpoint
        const famEndpoint = 'https://famgateway.in/api/create-order.php';
        const famRes = await fetch(famEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${famApiKey.trim()}`,
            'X-Api-Key': famApiKey.trim(),
          },
          body: JSON.stringify(payload),
        });

        if (famRes.ok) {
          const json = await famRes.json();
          gatewayRawResponse = json;
          const respData = json.response?.data || json.data || json;
          gatewayOrderId = respData.order_id || respData.id || respData.transaction_id || gatewayOrderId;
          gatewayPaymentUrl = respData.checkout_url || respData.payment_url || respData.qr_url || '';
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
// 2. AUTOMATIC ORDER STATUS POLLING & VERIFICATION HANDLER
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
    const famApiKey = process.env.FAMGATEWAY_API_KEY;

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
            order: {
              id: order.id,
              orderNumber: order.order_number,
              status: order.status,
              totalPaise: order.total_paise,
            },
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

          const gatewayOrderId = latestPayment?.gateway_order_id || order.order_number;

          if (gatewayOrderId) {
            try {
              const verifyUrl = `https://famgateway.in/api/verify-order.php?api_key=${encodeURIComponent(
                famApiKey.trim()
              )}&order_id=${encodeURIComponent(gatewayOrderId.trim())}`;

              const gwRes = await fetch(verifyUrl, {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${famApiKey.trim()}`,
                  'X-Api-Key': famApiKey.trim(),
                  Accept: 'application/json',
                },
              });

              if (gwRes.ok) {
                const gwData = await gwRes.json();
                const gwStatus = String(gwData.status || gwData.data?.status || '').toLowerCase().trim();

                if (gwStatus === 'success' || gwStatus === 'completed' || gwStatus === 'paid') {
                  const txnId = gwData.data?.transaction_id || gwData.data?.utr || `TXN-${Date.now()}`;
                  const utr = gwData.data?.utr || null;

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
                        gateway_payment_id: txnId,
                        gateway_reference: utr || txnId,
                        updated_at: new Date().toISOString(),
                      })
                      .eq('id', latestPayment.id);
                  }

                  return sendJsonResponse(res, 200, {
                    success: true,
                    status: 'SUCCESS',
                    isPaid: true,
                    order: {
                      id: order.id,
                      orderNumber: order.order_number,
                      status: 'PAID',
                      totalPaise: order.total_paise,
                    },
                    message: 'Payment verified automatically via FamGateway.',
                  });
                }
              }
            } catch (verifyErr) {
              console.warn('[FamGateway order-status] verification call notice:', verifyErr);
            }
          }
        }

        return sendJsonResponse(res, 200, {
          success: true,
          status: 'PENDING',
          isPaid: false,
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

    const supabase = getSupabaseClient();
    const famApiKey = process.env.FAMGATEWAY_API_KEY;

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

    const gatewayOrderId = latestPayment?.gateway_order_id || order.order_number;

    // Check with FamGateway API - NEVER blindly trust user-submitted UTR
    if (famApiKey && gatewayOrderId) {
      try {
        const verifyUrl = `https://famgateway.in/api/verify-order.php?api_key=${encodeURIComponent(
          famApiKey.trim()
        )}&order_id=${encodeURIComponent(gatewayOrderId.trim())}`;

        const gwRes = await fetch(verifyUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${famApiKey.trim()}`,
            'X-Api-Key': famApiKey.trim(),
            Accept: 'application/json',
          },
        });

        if (gwRes.ok) {
          const gwData = await gwRes.json();
          const gwStatus = String(gwData.status || gwData.data?.status || '').toLowerCase().trim();

          if (gwStatus === 'success' || gwStatus === 'completed' || gwStatus === 'paid') {
            const confirmedUtr = gwData.data?.utr || submittedUtr || `TXN-${Date.now()}`;

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
                  gateway_payment_id: confirmedUtr,
                  gateway_reference: confirmedUtr,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', latestPayment.id);
            }

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
      } catch (err: any) {
        console.warn('[FamGateway verify-utr] gateway check notice:', err);
      }
    }

    // If FamGateway does not confirm the payment, REJECT IT! Fake UTRs will NOT pass!
    return sendJsonResponse(res, 400, {
      success: false,
      isPaid: false,
      error:
        'Payment could not be verified by the banking gateway. If you just completed the payment, please allow 10–20 seconds for the bank to process and tap "Check Status" again.',
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

    const orderRef =
      payload?.order_id ||
      payload?.orderId ||
      payload?.order_number ||
      payload?.data?.order_id;
    const rawStatus = String(payload?.status || payload?.data?.status || 'SUCCESS').toUpperCase();

    console.log('[FamGateway Webhook] received:', { orderRef, rawStatus });

    if (orderRef) {
      const supabase = getSupabaseClient();
      if (supabase) {
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
          // Also update corresponding store_payments record
          let payQuery = supabase
            .from('store_payments')
            .update({
              status: 'SUCCESS',
              gateway_payment_id: payload?.data?.transaction_id || payload?.transaction_id || `TXN-${Date.now()}`,
              gateway_reference: payload?.data?.utr || payload?.utr || null,
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
