import { createClient } from '@supabase/supabase-js';

const AUTHORIZED_ADMIN_EMAIL = 'kumarsrijal732@gmail.com';

/**
 * Standardized JSON response helper for both Serverless (req, res)
 * and Web Standard Request/Response runtimes.
 */
function sendJsonResponse(
  res: any,
  status: number,
  body: Record<string, any>
): Response | void {
  const jsonStr = JSON.stringify(body);
  if (res && typeof res.status === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(status).json(body);
  }

  return new Response(jsonStr, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

/**
 * Serverless Admin Payment Review & Order Controller
 *
 * POST /api/store/admin/review-order
 */
export default async function handler(req: any, res?: any) {
  // CORS & Preflight
  if (req.method === 'OPTIONS') {
    return sendJsonResponse(res, 200, { success: true, message: 'Preflight OK' });
  }

  if (req.method !== 'POST') {
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Allow', 'POST, OPTIONS');
    }
    return sendJsonResponse(res, 405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers?.authorization || req.headers?.get?.('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

    if (!supabaseUrl || !serviceRoleKey) {
      return sendJsonResponse(res, 500, {
        success: false,
        error: 'Database service unconfigured.',
      });
    }

    // 1. Verify Admin Authentication
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    let adminEmail = '';
    let adminUserId = '';

    if (token) {
      const { data: userData, error: userError } = await authClient.auth.getUser(token);
      if (!userError && userData?.user) {
        adminUserId = userData.user.id;
        adminEmail = (userData.user.email || '').toLowerCase().trim();
      }
    }

    if (!adminEmail || adminEmail !== AUTHORIZED_ADMIN_EMAIL) {
      return sendJsonResponse(res, 403, {
        success: false,
        error: 'Access Denied: Authorized administrator credentials required.',
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    } else if (!body && typeof req.json === 'function') {
      body = await req.json().catch(() => ({}));
    }
    body = body || {};

    const { orderId, action, reason, deliveryNotes, adminNotes } = body;

    if (!orderId || !action) {
      return sendJsonResponse(res, 400, {
        success: false,
        error: 'Order ID and action parameters are required.',
      });
    }

    // 2. Fetch target order
    const { data: order, error: orderErr } = await adminClient
      .from('store_orders')
      .select('*, store_order_items(*), store_payments(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return sendJsonResponse(res, 404, {
        success: false,
        error: 'Store order not found.',
      });
    }

    const prevStatus = order.status;
    const prevFulfillment = order.fulfillment_status || 'UNFULFILLED';
    const nowIso = new Date().toISOString();

    // ACTION 1: APPROVE_PAYMENT
    if (action === 'APPROVE_PAYMENT') {
      // Idempotency: If already paid or delivered, return success immediately without duplicating
      if (order.status === 'PAID' || order.status === 'DELIVERED') {
        return sendJsonResponse(res, 200, {
          success: true,
          message: 'Order was already approved previously.',
          order,
        });
      }

      const { data: updatedOrder, error: updateErr } = await adminClient
        .from('store_orders')
        .update({
          status: 'PAID',
          fulfillment_status: 'READY_FOR_DELIVERY',
          approved_at: nowIso,
          approved_by: adminUserId,
          payment_reviewed_at: nowIso,
          payment_reviewed_by: adminUserId,
          updated_at: nowIso,
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

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
          await adminClient.from('store_downloads').insert({
            order_id: order.id,
            order_item_id: item.id,
            user_id: order.user_id || null,
            product_id: item.product_id,
            download_count: 0,
          });
        }
      }

      // Record audit log
      await adminClient.from('store_order_audit_logs').insert({
        order_id: order.id,
        admin_user_id: adminUserId,
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

      return sendJsonResponse(res, 200, {
        success: true,
        message: 'Payment approved successfully. Order is marked PAID and ready for delivery.',
        order: updatedOrder,
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
          rejected_by: adminUserId,
          payment_reviewed_at: nowIso,
          payment_reviewed_by: adminUserId,
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
        admin_user_id: adminUserId,
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
          delivered_by: adminUserId,
          delivery_notes: notes || order.delivery_notes || null,
          updated_at: nowIso,
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      await adminClient.from('store_order_audit_logs').insert({
        order_id: order.id,
        admin_user_id: adminUserId,
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
        admin_user_id: adminUserId,
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
        admin_user_id: adminUserId,
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
  } catch (err: any) {
    console.error('review-order endpoint error:', err);
    return sendJsonResponse(res, 500, {
      success: false,
      error: err.message || 'Internal Server Error',
    });
  }
}
