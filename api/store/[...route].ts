import { createClient } from '@supabase/supabase-js';

console.log('[STORE ROUTE] module loaded');

const AUTHORIZED_ADMIN_EMAIL = 'kumarsrijal732@gmail.com';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return UUID_REGEX.test(str.trim());
}

/**
 * Standardized JSON response helper for Serverless (req, res) runtimes.
 */
function sendJsonResponse(
  res: any,
  status: number,
  body: Record<string, any>
): any {
  if (res?.headersSent) {
    return;
  }

  const jsonStr = JSON.stringify(body);
  if (res && typeof res.status === 'function') {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-FamGateway-Signature, X-Signature, X-Api-Key'
      );
    } catch {}
    return res.status(status).json(body);
  }

  if (typeof Response !== 'undefined') {
    return new Response(jsonStr, {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-FamGateway-Signature, X-Signature, X-Api-Key',
      },
    });
  }

  return body;
}

/**
 * Universal order resolution helper that never crashes on non-UUID identifiers.
 */
async function resolveOrder(adminClient: any, rawIdentifier: string) {
  const cleanId = String(rawIdentifier || '').trim();
  if (!cleanId) return null;

  const cleanIsUuid = isUuid(cleanId);
  let order: any = null;

  // 1. Direct UUID lookup on store_orders.id
  if (cleanIsUuid) {
    const { data: byId } = await adminClient
      .from('store_orders')
      .select('*, store_order_items(*), store_payments(*)')
      .eq('id', cleanId)
      .maybeSingle();
    if (byId) order = byId;
  }

  // 2. Lookup by store_orders.order_number
  if (!order) {
    const { data: byNum } = await adminClient
      .from('store_orders')
      .select('*, store_order_items(*), store_payments(*)')
      .eq('order_number', cleanId)
      .maybeSingle();
    if (byNum) order = byNum;
  }

  // 3. Search store_payments by gateway_order_id, gateway_payment_id, gateway_reference
  if (!order) {
    const { data: payments } = await adminClient
      .from('store_payments')
      .select('order_id')
      .or(
        `gateway_order_id.eq.${cleanId},gateway_payment_id.eq.${cleanId},gateway_reference.eq.${cleanId}`
      )
      .limit(1);

    if (payments && payments.length > 0 && payments[0].order_id) {
      const { data: byPayment } = await adminClient
        .from('store_orders')
        .select('*, store_order_items(*), store_payments(*)')
        .eq('id', payments[0].order_id)
        .maybeSingle();
      if (byPayment) order = byPayment;
    }
  }

  // 4. UUID lookup on store_payments.id
  if (!order && cleanIsUuid) {
    const { data: payById } = await adminClient
      .from('store_payments')
      .select('order_id')
      .eq('id', cleanId)
      .maybeSingle();

    if (payById && payById.order_id) {
      const { data: byPayId } = await adminClient
        .from('store_orders')
        .select('*, store_order_items(*), store_payments(*)')
        .eq('id', payById.order_id)
        .maybeSingle();
      if (byPayId) order = byPayId;
    }
  }

  return order;
}

/**
 * Authenticates admin credentials from Bearer token
 */
async function authenticateAdmin(
  authHeader: string,
  supabaseUrl: string,
  supabaseAnonKey: string
) {
  const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
  let adminEmail = '';
  let adminUserId = '';
  let isAdmin = false;

  if (token && supabaseUrl && supabaseAnonKey) {
    try {
      const authClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data: userData, error: userError } = await authClient.auth.getUser(token);
      if (!userError && userData?.user) {
        adminUserId = userData.user.id;
        adminEmail = (userData.user.email || '').toLowerCase().trim();
        if (
          adminEmail === AUTHORIZED_ADMIN_EMAIL ||
          userData.user.app_metadata?.role === 'admin' ||
          userData.user.user_metadata?.role === 'admin' ||
          userData.user.user_metadata?.role === 'super_admin'
        ) {
          isAdmin = true;
        }
      }
    } catch (authErr) {
      console.warn('[ADMIN APPROVAL] Admin auth token verification notice:', authErr);
    }
  }

  return { isAdmin, adminEmail, adminUserId };
}

/**
 * Admin Review Order Controller (Handles GET & POST)
 */
async function handleAdminReviewOrder(req: any, res: any) {
  // CORS & Preflight
  if (req.method === 'OPTIONS') {
    if (res && typeof res.status === 'function') {
      return res.status(200).end();
    }
    return sendJsonResponse(res, 200, { success: true, message: 'Preflight OK' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[ADMIN APPROVAL] Database service unconfigured: Missing supabaseUrl or serviceRoleKey');
    return sendJsonResponse(res, 500, {
      success: false,
      error: 'Database service unconfigured.',
    });
  }

  const authHeader =
    req.headers?.authorization ||
    req.headers?.Authorization ||
    req.headers?.get?.('authorization') ||
    '';

  const { isAdmin, adminEmail, adminUserId } = await authenticateAdmin(
    authHeader,
    supabaseUrl,
    supabaseAnonKey
  );

  console.log('[ADMIN APPROVAL] Admin authenticated:', {
    method: req.method,
    hasAuthHeader: !!authHeader,
    adminEmail: adminEmail || 'NONE',
    isAdmin,
  });

  if (!isAdmin) {
    return sendJsonResponse(res, 403, {
      success: false,
      error: 'Access Denied: Authorized administrator credentials required.',
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // =========================================================================
  // GET: Retrieve payment review data / reviewable orders
  // =========================================================================
  if (req.method === 'GET') {
    try {
      const targetId =
        req.query?.orderId ||
        req.query?.order_id ||
        req.query?.orderNumber ||
        req.query?.order_number ||
        req.query?.id;

      if (targetId) {
        console.log('[ADMIN APPROVAL] GET review details for identifier:', targetId);
        const order = await resolveOrder(adminClient, String(targetId));
        if (!order) {
          return sendJsonResponse(res, 404, {
            success: false,
            error: `Store order not found matching identifier: ${targetId}`,
          });
        }
        return sendJsonResponse(res, 200, {
          success: true,
          order,
        });
      }

      // Return orders awaiting payment review
      console.log('[ADMIN APPROVAL] GET listing orders for review.');
      const { data: reviewOrders, error: listErr } = await adminClient
        .from('store_orders')
        .select('*, store_order_items(*, store_products(*)), store_payments(*)')
        .eq('status', 'PAYMENT_REVIEW')
        .order('created_at', { ascending: false });

      if (listErr) {
        console.error('[ADMIN APPROVAL] GET error fetching review orders:', listErr);
        throw listErr;
      }

      return sendJsonResponse(res, 200, {
        success: true,
        orders: reviewOrders || [],
        count: (reviewOrders || []).length,
      });
    } catch (getErr: any) {
      console.error('[ADMIN APPROVAL] GET exception:', getErr);
      return sendJsonResponse(res, 500, {
        success: false,
        error: getErr?.message || 'Failed to retrieve payment review orders.',
      });
    }
  }

  // =========================================================================
  // POST: Execute review actions (Approve, Reject, Notes, Delivery)
  // =========================================================================
  if (req.method === 'POST') {
    // Parse request body defensively
    let body = req.body;
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(body)) {
      try {
        body = JSON.parse(body.toString('utf-8'));
      } catch {
        body = {};
      }
    } else if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    } else if (!body && typeof req.json === 'function') {
      body = await req.json().catch(() => ({}));
    }
    body = body || {};

    const rawOrderId =
      body.orderId ||
      body.order_id ||
      body.orderNumber ||
      body.order_number ||
      body.reference;
    const action = body.action || body.reviewAction || body.status;
    const { reason, deliveryNotes, adminNotes } = body;

    console.log('[ADMIN APPROVAL] Body parsed & identifier extracted:', {
      action,
      extractedIdentifier: rawOrderId ? String(rawOrderId).slice(0, 36) : 'NONE',
    });

    if (!rawOrderId || !action) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'Order ID and action parameters are required.',
      });
    }

    const cleanOrderId = String(rawOrderId).trim();
    console.log('[ADMIN APPROVAL] Order lookup started for:', cleanOrderId);
    const order = await resolveOrder(adminClient, cleanOrderId);

    console.log('[ADMIN APPROVAL] Order found:', {
      requestedOrderId: cleanOrderId,
      matchedOrderNumber: order?.order_number,
      matchedOrderId: order?.id,
      currentStatus: order?.status,
      actionRequested: action,
    });

    if (!order) {
      return sendJsonResponse(res, 404, {
        success: false,
        error: `Store order not found matching identifier: ${cleanOrderId}`,
      });
    }

    const prevStatus = order.status;
    const prevFulfillment = order.fulfillment_status || 'UNFULFILLED';
    const nowIso = new Date().toISOString();
    const validAdminUserId = isUuid(adminUserId) ? adminUserId : null;

    // ACTION 1: APPROVE_PAYMENT
    if (action === 'APPROVE_PAYMENT') {
      console.log('[ADMIN APPROVAL] Update started:', {
        targetStatus: 'PAID',
        action,
        orderNumber: order.order_number,
      });

      // Idempotency: If already paid or delivered, return success immediately
      if (order.status === 'PAID' || order.status === 'DELIVERED') {
        console.log('[ADMIN APPROVAL] Order already approved idempotently:', order.order_number);
        return sendJsonResponse(res, 200, {
          success: true,
          message: `Order ${order.order_number} is already marked as ${order.status}.`,
          order,
        });
      }

      if (order.status === 'CANCELLED') {
        return sendJsonResponse(res, 400, {
          success: false,
          error: `Cannot approve order ${order.order_number}: Order has already been cancelled.`,
        });
      }

      if (order.status === 'REJECTED') {
        return sendJsonResponse(res, 400, {
          success: false,
          error: `Cannot approve order ${order.order_number}: Order was previously rejected.`,
        });
      }

      const { data: updatedOrder, error: updateErr } = await adminClient
        .from('store_orders')
        .update({
          status: 'PAID',
          fulfillment_status: 'READY_FOR_DELIVERY',
          approved_at: nowIso,
          approved_by: validAdminUserId,
          payment_reviewed_at: nowIso,
          payment_reviewed_by: validAdminUserId,
          updated_at: nowIso,
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) {
        console.error('[ADMIN APPROVAL] Order status update error:', updateErr);
        throw updateErr;
      }

      // Update related payment records to SUCCESS
      await adminClient
        .from('store_payments')
        .update({
          status: 'SUCCESS',
          updated_at: nowIso,
        })
        .eq('order_id', order.id);

      // Create download entitlements if items exist
      const items = order.store_order_items || [];
      for (const item of items) {
        const { data: existingDl } = await adminClient
          .from('store_downloads')
          .select('id')
          .eq('order_id', order.id)
          .eq('order_item_id', item.id)
          .maybeSingle();

        if (!existingDl) {
          const itemUserId = isUuid(order.user_id) ? order.user_id : null;
          await adminClient.from('store_downloads').insert({
            order_id: order.id,
            order_item_id: item.id,
            user_id: itemUserId,
            product_id: item.product_id,
            download_count: 0,
          });
        }
      }

      // Record audit log
      await adminClient.from('store_order_audit_logs').insert({
        order_id: order.id,
        admin_user_id: validAdminUserId,
        admin_email: adminEmail,
        action: 'PAYMENT_APPROVED',
        previous_status: prevStatus,
        new_status: 'PAID',
        details: {
          approvedAt: nowIso,
          approvedByEmail: adminEmail,
          note: 'Payment verified and approved by administrator in review console.',
        },
      });

      console.log('[ADMIN APPROVAL] Update succeeded for order:', {
        orderId: order.id,
        orderNumber: order.order_number,
        newStatus: 'PAID',
      });

      return sendJsonResponse(res, 200, {
        success: true,
        message: `Payment for order ${order.order_number} approved successfully. Order is marked PAID and downloads unlocked.`,
        order: updatedOrder || {
          ...order,
          status: 'PAID',
          fulfillment_status: 'READY_FOR_DELIVERY',
        },
      });
    }

    // ACTION 2: REJECT_PAYMENT
    if (action === 'REJECT_PAYMENT') {
      const rejectionReason = (reason || '').trim();
      if (!rejectionReason) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Rejection reason is required.',
        });
      }

      const { data: updatedOrder, error: updateErr } = await adminClient
        .from('store_orders')
        .update({
          status: 'REJECTED',
          payment_rejection_reason: rejectionReason,
          rejected_at: nowIso,
          rejected_by: validAdminUserId,
          payment_reviewed_at: nowIso,
          payment_reviewed_by: validAdminUserId,
          updated_at: nowIso,
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      await adminClient
        .from('store_payments')
        .update({
          status: 'REJECTED',
          updated_at: nowIso,
        })
        .eq('order_id', order.id);

      await adminClient
        .from('store_downloads')
        .update({ revoked_at: nowIso })
        .eq('order_id', order.id);

      await adminClient.from('store_order_audit_logs').insert({
        order_id: order.id,
        admin_user_id: validAdminUserId,
        admin_email: adminEmail,
        action: 'PAYMENT_REJECTED',
        previous_status: prevStatus,
        new_status: 'REJECTED',
        details: {
          rejectionReason,
          rejectedAt: nowIso,
          rejectedByEmail: adminEmail,
        },
      });

      return sendJsonResponse(res, 200, {
        success: true,
        message: 'Payment review marked as rejected.',
        order: updatedOrder,
      });
    }

    // ACTION 3: MARK_DELIVERED
    if (action === 'MARK_DELIVERED') {
      const notes = (deliveryNotes || '').trim();

      const { data: updatedOrder, error: updateErr } = await adminClient
        .from('store_orders')
        .update({
          status: order.status === 'PAID' ? 'DELIVERED' : order.status,
          fulfillment_status: 'DELIVERED',
          delivered_at: nowIso,
          delivered_by: validAdminUserId,
          delivery_notes: notes || order.delivery_notes || null,
          updated_at: nowIso,
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      await adminClient.from('store_order_audit_logs').insert({
        order_id: order.id,
        admin_user_id: validAdminUserId,
        admin_email: adminEmail,
        action: 'ORDER_DELIVERED',
        previous_status: prevFulfillment,
        new_status: 'DELIVERED',
        details: {
          deliveryNotes: notes,
          deliveredAt: nowIso,
          deliveredByEmail: adminEmail,
        },
      });

      return sendJsonResponse(res, 200, {
        success: true,
        message: 'Order marked as Delivered.',
        order: updatedOrder,
      });
    }

    // ACTION 4: LOG_WHATSAPP_SENT
    if (action === 'LOG_WHATSAPP_SENT') {
      const notes = (deliveryNotes || '').trim();

      if (notes) {
        await adminClient
          .from('store_orders')
          .update({
            delivery_notes: notes,
            updated_at: nowIso,
          })
          .eq('id', order.id);
      }

      await adminClient.from('store_order_audit_logs').insert({
        order_id: order.id,
        admin_user_id: validAdminUserId,
        admin_email: adminEmail,
        action: 'DELIVERY_SENT_WHATSAPP',
        previous_status: prevStatus,
        new_status: order.status,
        details: {
          sentToPhone: order.customer_phone || 'WhatsApp',
          deliveryNotes: notes,
          timestamp: nowIso,
        },
      });

      return sendJsonResponse(res, 200, {
        success: true,
        message: 'WhatsApp delivery interaction logged.',
      });
    }

    // ACTION 5: ADD_NOTE
    if (action === 'ADD_NOTE') {
      const noteText = (adminNotes || '').trim();

      const { data: updatedOrder, error: updateErr } = await adminClient
        .from('store_orders')
        .update({
          admin_notes: noteText,
          updated_at: nowIso,
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      await adminClient.from('store_order_audit_logs').insert({
        order_id: order.id,
        admin_user_id: validAdminUserId,
        admin_email: adminEmail,
        action: 'ADMIN_NOTE_ADDED',
        previous_status: prevStatus,
        new_status: order.status,
        details: {
          note: noteText,
          addedAt: nowIso,
        },
      });

      return sendJsonResponse(res, 200, {
        success: true,
        message: 'Admin note saved.',
        order: updatedOrder,
      });
    }

    return sendJsonResponse(res, 400, {
      success: false,
      error: `Unknown review action: ${action}`,
    });
  }

  // Any other method
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
  }
  return sendJsonResponse(res, 405, {
    success: false,
    error: 'Method not allowed',
  });
}

/**
 * Payment Verification Controller
 */
async function handlePaymentVerify(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Allow', 'GET, POST, OPTIONS');
    }
    return sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const orderId =
      req.query?.order_id ||
      req.query?.orderId ||
      req.body?.orderId ||
      req.body?.order_id;

    if (!orderId) {
      return sendJsonResponse(res, 400, { success: false, error: 'Order ID is required.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
    if (!supabase) {
      return sendJsonResponse(res, 200, {
        orderId,
        status: 'PAYMENT_REVIEW',
        verified: false,
        message: 'Database unconfigured',
      });
    }

    const order = await resolveOrder(supabase, String(orderId));
    if (!order) {
      return sendJsonResponse(res, 404, { success: false, error: 'Order not found in database.' });
    }

    // If already PAID, DELIVERED, or REJECTED
    if (order.status === 'PAID' || order.status === 'DELIVERED') {
      const latestPayment = order.store_payments?.[0];
      return sendJsonResponse(res, 200, {
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        fulfillmentStatus: order.fulfillment_status,
        verified: true,
        amountPaise: order.total_paise,
        currency: order.currency,
        gatewayOrderId: latestPayment?.gateway_order_id || null,
        gatewayPaymentId: latestPayment?.gateway_payment_id || null,
        message: 'Payment has been confirmed and approved by administrator.',
      });
    }

    if (order.status === 'REJECTED') {
      return sendJsonResponse(res, 200, {
        orderId: order.id,
        orderNumber: order.order_number,
        status: 'REJECTED',
        verified: false,
        rejectionReason: order.payment_rejection_reason,
        message: `Payment review rejected: ${order.payment_rejection_reason || 'Could not be verified.'}`,
      });
    }

    const latestPayment = order.store_payments?.[0];
    const gatewayOrderId = latestPayment?.gateway_order_id;

    if (!gatewayOrderId) {
      return sendJsonResponse(res, 200, {
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        verified: false,
        message: 'No gateway order ID associated with this order.',
      });
    }

    // Call FamGateway verify-order endpoint if configured
    const famApiKey = process.env.FAMGATEWAY_API_KEY;
    if (!famApiKey) {
      return sendJsonResponse(res, 200, {
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        verified: false,
        message: 'FAMGATEWAY_API_KEY is not configured on server.',
      });
    }

    const verifyUrl = `https://famgateway.in/api/verify-order.php?api_key=${encodeURIComponent(famApiKey.trim())}&order_id=${encodeURIComponent(gatewayOrderId.trim())}`;
    let famGatewayStatus = 'pending';
    let famGatewayData: any = null;

    try {
      const gwRes = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${famApiKey.trim()}`,
          'X-Api-Key': famApiKey.trim(),
          'Accept': 'application/json',
        },
      });

      const rawText = await gwRes.text();
      try {
        famGatewayData = JSON.parse(rawText);
      } catch {
        famGatewayData = { rawText };
      }

      if (gwRes.ok && famGatewayData) {
        famGatewayStatus = (famGatewayData.status || '').toLowerCase().trim();
      }
    } catch (networkErr: any) {
      console.error('[payment-verify] FamGateway verification network error:', networkErr);
    }

    const paymentData = famGatewayData?.data || famGatewayData?.response?.data || famGatewayData;

    if (famGatewayStatus === 'success') {
      const transactionId = paymentData?.transaction_id || paymentData?.utr || `TXN-${Date.now()}`;
      const utr = paymentData?.utr || null;
      const senderName = paymentData?.sender_name || null;
      const paymentTime = paymentData?.payment_time_ist || new Date().toISOString();

      if (order.status !== 'PAID') {
        await supabase
          .from('store_orders')
          .update({
            status: 'PAID',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        await supabase.from('store_order_audit_logs').insert({
          order_id: order.id,
          action: 'PAYMENT_VERIFIED_AUTOMATIC',
          previous_status: order.status,
          new_status: 'PAID',
          details: {
            gatewayOrderId,
            transactionId,
            utr,
            senderName,
            paymentTime,
            verifiedVia: 'verify-order.php',
          },
        });
      }

      if (latestPayment?.id) {
        await supabase
          .from('store_payments')
          .update({
            status: 'SUCCESS',
            gateway_payment_id: transactionId,
            gateway_reference: utr || transactionId,
            raw_reference_metadata: {
              ...(latestPayment.raw_reference_metadata || {}),
              famGatewayVerifyResponse: famGatewayData,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', latestPayment.id);
      }

      return sendJsonResponse(res, 200, {
        orderId: order.id,
        orderNumber: order.order_number,
        status: 'PAID',
        verified: true,
        amountPaise: order.total_paise,
        currency: order.currency,
        gatewayOrderId,
        gatewayPaymentId: transactionId,
        utr,
        senderName,
        message: 'Payment verified and completed automatically!',
      });
    }

    return sendJsonResponse(res, 200, {
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
      verified: false,
      gatewayStatus: famGatewayStatus,
      message: famGatewayData?.message || 'Payment is pending verification.',
    });
  } catch (err: any) {
    console.error('[payment-verify] Server error:', err);
    return sendJsonResponse(res, 500, { success: false, error: err?.message || 'Internal Server Error' });
  }
}

/**
 * Digital Download Controller
 */
async function handleDownload(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Allow', 'GET, POST, OPTIONS');
    }
    return sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const downloadId = req.query?.downloadId || req.query?.id || req.body?.downloadId;
    if (!downloadId) {
      return sendJsonResponse(res, 400, { success: false, error: 'Download ID parameter is required.' });
    }

    const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return sendJsonResponse(res, 401, { success: false, error: 'Authentication required to download digital products.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

    if (!supabaseUrl || !supabaseAnonKey) {
      return sendJsonResponse(res, 500, { success: false, error: 'Database service unconfigured.' });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userData, error: userError } = await authClient.auth.getUser(token);

    if (userError || !userData?.user) {
      return sendJsonResponse(res, 401, { success: false, error: 'Invalid or expired user session.' });
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email?.toLowerCase();
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: download, error: dlError } = await adminClient
      .from('store_downloads')
      .select('*, store_orders(*), store_products(*)')
      .eq('id', downloadId)
      .single();

    if (dlError || !download) {
      return sendJsonResponse(res, 404, { success: false, error: 'Download access record not found.' });
    }

    const isAuthorizedAdmin = userEmail === AUTHORIZED_ADMIN_EMAIL;
    const isOwner = download.user_id === userId;

    if (!isOwner && !isAuthorizedAdmin) {
      return sendJsonResponse(res, 403, { success: false, error: 'Access Denied: You do not own this digital product.' });
    }

    if (download.revoked_at) {
      return sendJsonResponse(res, 403, { success: false, error: 'Access to this download has been revoked.' });
    }

    const order = download.store_orders;
    if (!order || (order.status !== 'PAID' && order.status !== 'DELIVERED')) {
      return sendJsonResponse(res, 402, { success: false, error: 'Payment required: Order is not verified as PAID or DELIVERED.' });
    }

    const product = download.store_products;
    const productFilePath = product?.product_file_path;

    if (!productFilePath) {
      return sendJsonResponse(res, 404, { success: false, error: 'No downloadable digital file is attached to this product.' });
    }

    const { data: signedUrlData, error: signError } = await adminClient.storage
      .from('store-products-private')
      .createSignedUrl(productFilePath, 300, {
        download: product.file_name || `${product.slug || 'download'}.zip`,
      });

    if (signError || !signedUrlData?.signedUrl) {
      return sendJsonResponse(res, 500, { success: false, error: 'Failed to generate secure download link.' });
    }

    await adminClient
      .from('store_downloads')
      .update({
        download_count: (download.download_count || 0) + 1,
        last_downloaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', downloadId);

    return sendJsonResponse(res, 200, {
      success: true,
      downloadUrl: signedUrlData.signedUrl,
      fileName: product.file_name || 'download.zip',
      expiresInSeconds: 300,
    });
  } catch (err: any) {
    console.error('[download] Server error:', err);
    return sendJsonResponse(res, 500, { success: false, error: 'Internal Server Error' });
  }
}

/**
 * Consolidated Store API Catch-All Router for Vercel Serverless
 *
 * Routes handled:
 * - /api/store/admin/review-order (GET: list/view reviews, POST: approve/reject)
 * - /api/store/payment/verify
 * - /api/store/download
 * - /api/store/create-order
 * - /api/store/payment/create
 */
export default async function handler(req: any, res: any) {
  try {
    // CORS & Preflight Headers
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-FamGateway-Signature, X-Signature, X-Api-Key'
      );
    }

    if (req.method === 'OPTIONS') {
      if (res && typeof res.status === 'function') {
        return res.status(200).end();
      }
      return sendJsonResponse(res, 200, { success: true, message: 'Preflight OK' });
    }

    // Determine subroute safely from query parameter (Vercel catch-all) or URL pathname
    let routeSegments: string[] = [];
    let queryRoute: any = req.query?.route || req.query?.path;

    if (!queryRoute && req.url && req.url.includes('?')) {
      try {
        const parsedUrl = new URL(req.url, 'http://localhost');
        queryRoute = parsedUrl.searchParams.get('route') || parsedUrl.searchParams.get('path');
      } catch {}
    }

    if (Array.isArray(queryRoute)) {
      routeSegments = queryRoute.map(String).filter(Boolean);
    } else if (typeof queryRoute === 'string') {
      routeSegments = queryRoute.split('/').filter(Boolean);
    } else if (req.url) {
      const pathname = (req.originalUrl || req.url).split('?')[0] || '';
      const match = pathname.replace(/^\/?api\/store\/?/i, '');
      routeSegments = match.split('/').filter(Boolean);
    }

    const subroute = routeSegments.join('/').toLowerCase().trim();

    // Required Startup Diagnostics
    console.log('[STORE ROUTE] handler entered');
    console.log(`[STORE ROUTE] method=${req.method}`);
    console.log('[STORE ROUTE] raw route received:', queryRoute);
    console.log(`[STORE ROUTE] normalized route=${subroute}`);

    switch (subroute) {
      case 'admin/review-order':
        console.log('[STORE ROUTE] before admin/review-order handler');
        return await handleAdminReviewOrder(req, res);

      case 'payment/verify':
        return await handlePaymentVerify(req, res);

      case 'download':
        return await handleDownload(req, res);

      default:
        return sendJsonResponse(res, 404, {
          success: false,
          error: `Store route not found: ${subroute || '/'}`,
          validRoutes: [
            '/api/store/create-order',
            '/api/store/payment/create',
            '/api/store/payment/verify',
            '/api/store/download',
            '/api/store/admin/review-order',
          ],
        });
    }
  } catch (routerErr: any) {
    console.error('[Store Router] Fatal catch-all exception:', routerErr);
    return sendJsonResponse(res, 500, {
      success: false,
      error: routerErr?.message || 'Internal Server Error in Store Router',
      requestId: `err_${Date.now()}`,
    });
  }
}

// Export sub-handlers for server.ts integration
export {
  handleAdminReviewOrder as reviewOrderHandler,
  handlePaymentVerify as paymentVerifyHandler,
  handleDownload as downloadHandler,
};
