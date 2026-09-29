import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { ticket_id, message, is_internal = false } = body;

    if (!ticket_id || !message?.trim()) {
      return res.status(400).json({ error: 'Ticket ID and message are required.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

    if (!supabase) {
      return res.status(500).json({ error: 'Database service unconfigured' });
    }

    // Authenticate user
    let authenticatedUser: any = null;
    let isAdmin = false;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          authenticatedUser = user;
          isAdmin =
            user.email === 'kumarsrijal732@gmail.com' ||
            user.app_metadata?.role === 'admin' ||
            user.user_metadata?.role === 'admin';
        }
      } catch (err) {}
    }

    // Fetch ticket to verify permissions
    const { data: ticket, error: ticketErr } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticket_id)
      .single();

    if (ticketErr || !ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    if (!isAdmin && ticket.user_id && ticket.user_id !== authenticatedUser?.id) {
      return res.status(403).json({ error: 'Unauthorized to reply to this ticket.' });
    }

    // Only admin can post internal notes
    const internalFlag = isAdmin ? Boolean(is_internal) : false;
    const senderType = isAdmin ? 'admin' : 'customer';
    const now = new Date().toISOString();

    const { data: newMsg, error: msgErr } = await supabase
      .from('support_ticket_messages')
      .insert({
        ticket_id,
        sender_type: senderType,
        sender_id: authenticatedUser?.id || null,
        sender_name: isAdmin ? 'VyapaarPro Support' : authenticatedUser?.user_metadata?.full_name || ticket.guest_name || 'Customer',
        message: message.trim(),
        is_internal: internalFlag,
        created_at: now,
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    // Update ticket updated_at and status if needed
    const nextStatus = isAdmin
      ? internalFlag ? ticket.status : 'waiting_for_customer'
      : ticket.status === 'resolved' || ticket.status === 'closed' ? 'open' : ticket.status;

    await supabase
      .from('support_tickets')
      .update({
        status: nextStatus,
        updated_at: now,
      })
      .eq('id', ticket_id);

    return res.status(200).json({
      success: true,
      message: newMsg,
    });
  } catch (err: any) {
    console.error('Ticket reply error:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit reply' });
  }
}
