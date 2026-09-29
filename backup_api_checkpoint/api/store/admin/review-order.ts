import { createClient } from '@supabase/supabase-js';

const AUTHORIZED_ADMIN_EMAIL = 'kumarsrijal732@gmail.com';

/**
 * Serverless Admin Payment Review & Delivery Controller
 *
 * POST /api/store/admin/review-order
 *
 * Strictly enforces admin authentication and provides audit-logged actions:
 * - APPROVE_PAYMENT
 * - REJECT_PAYMENT
 * - MARK_DELIVERED
 * - LOG_WHATSAPP_SENT
 * - ADD_NOTE
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Database service unconfigured.' });
    }

    // 1. Verify Admin Authentication
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userData, error: userError } = await authClient.auth.getUser(token);

    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const adminUser = userData.user;
    const adminEmail = (adminUser.email || '').toLowerCase().trim();

    if (adminEmail !== AUTHORIZED_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Access Denied: Administrator permissions required.' });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { orderId, action, reason, deliveryNotes, adminNotes } = body;

    if (!orderId || !action) {
      return res.status(400).json({ error: 'Order ID and action are required.' });
    }

    // 2. Fetch target order
    const { data: order, error: orderErr } = await adminClient
      .from('store_orders')
      .select('*, store_order_items(*), store_payments(*)')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Store order not found.' });
    }

    const prevStatus = order.status;
    const prevFulfillment = order.fulfillment_status || 'UNFULFILLED';
    const nowIso = new Date().toISOString();

    // =========================================================================
    // ACTION 1: APPROVE_PAYMENT
    // =========================================================================
    if (action === 'APPROVE_PAYMENT') {
      if (order.status === 'PAID' || order.status === 'DELIVERED') {
        return res.status(200).json({
          success: true,
          message: 'Order was already approved.',
          order,
        });
      }

      // Update store_orders to PAID & READY_FOR_DELIVERY
      const { data: updatedOrder, error: updateErr } = await adminClient
        .from('store_orders')
        .update({
          status: 'PAID',
          fulfillment_status: 'READY_FOR_DELIVERY',
          approved_at: nowIso,
          approved_by: adminUser.id,
          payment_reviewed_at: nowIso,
          payment_reviewed_by: adminUser.id,
          updated_at: nowIso,
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Update store_payments to SUCCESS
      await adminClient
        .from('store_payments')
        .update({
          status: 'SUCCESS',
          updated_at: nowIso,
        })
        .eq('order_id', order.id);

      // Create download entitlement records idempotently
      const items = order.store_order_items || [];
      for (const item of items) {
        const { data: existingDl } = await adminClient
          .from('store_downloads')
          .select('id')
          .eq('order_id', order.id)
          .eq('order_item_id', item.id)
          .single();

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

      // Insert Immutable Audit Log
      await adminClient.from('store_order_audit_logs').insert({
        order_id: order.id,
        admin_user_id: adminUser.id,
        admin_email: adminEmail,
        action: 'PAYMENT_APPROVED',
        previous_status: prevStatus,
        new_status: 'PAID',
        details: {
          approvedAt: nowIso,
          approvedByEmail: adminEmail,
          note: 'Payment verified and approved by administrator.',
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Payment approved successfully. Order is ready for delivery.',
        order: updatedOrder,
      });
    }

    // =========================================================================
    // ACTION 2: REJECT_PAYMENT
    // =========================================================================
    if (action === 'REJECT_PAYMENT') {
      const rejectionReason = (reason || '').trim();
      if (!rejectionReason) {
        return res.status(400).json({ error: 'Rejection reason is required.' });
      }

      const { data: updatedOrder, error: updateErr } = await adminClient
        .from('store_orders')
        .update({
          status: 'REJECTED',
          payment_rejection_reason: rejectionReason,
          rejected_at: nowIso,
          rejected_by: adminUser.id,
          payment_reviewed_at: nowIso,
          payment_reviewed_by: adminUser.id,
          updated_at: nowIso,
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Update store_payments to REJECTED
      await adminClient
        .from('store_payments')
        .update({
          status: 'REJECTED',
          updated_at: nowIso,
        })
        .eq('order_id', order.id);

      // Revoke any existing download records if any
      await adminClient
        .from('store_downloads')
        .update({ revoked_at: nowIso })
        .eq('order_id', order.id);

      // Insert Audit Log
      await adminClient.from('store_order_audit_logs').insert({
        order_id: order.id,
        admin_user_id: adminUser.id,
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

      return res.status(200).json({
        success: true,
        message: 'Payment rejected.',
        order: updatedOrder,
      });
    }

    // =========================================================================
    // ACTION 3: MARK_DELIVERED
    // =========================================================================
    if (action === 'MARK_DELIVERED') {
      const notes = (deliveryNotes || '').trim();

      const { data: updatedOrder, error: updateErr } = await adminClient
        .from('store_orders')
        .update({
          status: order.status === 'PAID' ? 'DELIVERED' : order.status,
          fulfillment_status: 'DELIVERED',
          delivered_at: nowIso,
          delivered_by: adminUser.id,
          delivery_notes: notes || order.delivery_notes || null,
          updated_at: nowIso,
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // Insert Audit Log
      await adminClient.from('store_order_audit_logs').insert({
        order_id: order.id,
        admin_user_id: adminUser.id,
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

      return res.status(200).json({
        success: true,
        message: 'Order marked as Delivered.',
        order: updatedOrder,
      });
    }

    // =========================================================================
    // ACTION 4: LOG_WHATSAPP_SENT
    // =========================================================================
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
        admin_user_id: adminUser.id,
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

      return res.status(200).json({
        success: true,
        message: 'WhatsApp delivery interaction logged.',
      });
    }

    // =========================================================================
    // ACTION 5: ADD_NOTE
    // =========================================================================
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
        admin_user_id: adminUser.id,
        admin_email: adminEmail,
        action: 'ADMIN_NOTE_ADDED',
        previous_status: prevStatus,
        new_status: order.status,
        details: {
          note: noteText,
          addedAt: nowIso,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Admin note saved.',
        order: updatedOrder,
      });
    }

    return res.status(400).json({ error: `Unknown review action: ${action}` });
  } catch (err: any) {
    console.error('review-order endpoint error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
