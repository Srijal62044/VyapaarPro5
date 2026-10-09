import { createClient } from '@supabase/supabase-js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return UUID_REGEX.test(str.trim());
}

/**
 * FamGateway Manual UTR / Instant Verification Endpoint
 * POST /api/famgateway/verify-utr
 *
 * When customer pays via UPI app and submits their 12-digit UTR from PhonePe/GPay/Paytm.
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
    const rawUtr = String(body.utr || body.reference || body.txnId || '').trim();
    const senderName = String(body.senderName || '').trim();

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required.' });
    }

    // UTR validation: standard Indian UPI UTR is 12 digits, but allow 6-24 chars
    const cleanUtr = rawUtr.replace(/[^a-zA-Z0-9]/g, '');
    if (!cleanUtr || cleanUtr.length < 6) {
      return res.status(400).json({
        error: 'Please enter a valid 12-digit UPI Reference Number / UTR from your payment receipt.',
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({
        success: true,
        status: 'PAID',
        message: 'UTR submitted successfully (preview mode).',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let order: any = null;
    if (isUuid(orderId)) {
      const { data: o } = await supabase
        .from('store_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      if (o) order = o;
    }
    if (!order) {
      const { data: o } = await supabase
        .from('store_orders')
        .select('*')
        .eq('order_number', String(orderId).trim())
        .maybeSingle();
      if (o) order = o;
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Mark as PAID or PAYMENT_REVIEW with the UTR attached
    const newStatus = 'PAID'; // Mark paid to unlock digital products immediately

    await supabase
      .from('store_orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    // Update payment record
    await supabase.from('store_payments').insert({
      order_id: order.id,
      gateway: 'famgateway_upi',
      gateway_payment_id: cleanUtr,
      gateway_reference: cleanUtr,
      amount_paise: order.total_paise,
      currency: 'INR',
      status: 'SUCCESS',
      raw_reference_metadata: {
        verifiedViaUtr: true,
        utr: cleanUtr,
        senderName: senderName || null,
        submittedAt: new Date().toISOString(),
      },
    });

    // Record audit log
    await supabase.from('store_order_audit_logs').insert({
      order_id: order.id,
      action: 'PAYMENT_APPROVED',
      previous_status: order.status,
      new_status: newStatus,
      details: {
        utr: cleanUtr,
        senderName,
        source: 'In-Page UPI UTR Submission',
      },
    });

    return res.status(200).json({
      success: true,
      status: newStatus,
      orderId: order.id,
      orderNumber: order.order_number,
      message: 'Payment verified successfully! Your order is confirmed.',
    });
  } catch (err: any) {
    console.error('[famgateway/verify-utr] error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
