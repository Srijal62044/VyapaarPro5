import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
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

    // Authenticate Admin
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

    if (!isAdmin) {
      return res.status(403).json({ error: 'Access restricted to authorized administrators.' });
    }

    // GET /api/support/admin - Dashboard metrics, tickets, and human requests
    if (req.method === 'GET') {
      const { type = 'dashboard' } = req.query;

      if (type === 'conversations') {
        const { data: conversations } = await supabase
          .from('support_conversations')
          .select('*, support_messages(*)')
          .order('updated_at', { ascending: false })
          .limit(50);

        return res.status(200).json({ conversations: conversations || [] });
      }

      // Default: Dashboard stats + tickets list
      const [ticketsRes, convsRes] = await Promise.all([
        supabase
          .from('support_tickets')
          .select('*, support_ticket_messages(id, message, created_at, sender_type)')
          .order('created_at', { ascending: false }),
        supabase
          .from('support_conversations')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(30),
      ]);

      const tickets = ticketsRes.data || [];
      const conversations = convsRes.data || [];

      const stats = {
        totalTickets: tickets.length,
        openTickets: tickets.filter((t) => t.status === 'open').length,
        inProgressTickets: tickets.filter((t) => t.status === 'in_progress').length,
        waitingForCustomer: tickets.filter((t) => t.status === 'waiting_for_customer').length,
        resolvedTickets: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
        urgentTickets: tickets.filter((t) => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'resolved' && t.status !== 'closed').length,
        humanSupportRequests: conversations.filter((c) => c.requires_human && c.status === 'active').length,
      };

      return res.status(200).json({
        stats,
        tickets,
        conversations,
      });
    }

    // POST /api/support/admin - Update ticket metadata or status
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const {
        action,
        ticket_id,
        conversation_id,
        status,
        priority,
        assigned_admin_id,
        internal_notes,
      } = body;

      const now = new Date().toISOString();

      if (action === 'update_ticket' && ticket_id) {
        const updates: any = { updated_at: now };
        if (status) {
          updates.status = status;
          if (status === 'resolved' || status === 'closed') {
            updates.resolved_at = now;
          }
        }
        if (priority) updates.priority = priority;
        if (assigned_admin_id !== undefined) updates.assigned_admin_id = assigned_admin_id || null;
        if (internal_notes !== undefined) updates.internal_notes = internal_notes;

        const { data: updated, error: updateErr } = await supabase
          .from('support_tickets')
          .update(updates)
          .eq('id', ticket_id)
          .select()
          .single();

        if (updateErr) throw updateErr;

        return res.status(200).json({ success: true, ticket: updated });
      }

      if (action === 'resolve_human_request' && conversation_id) {
        await supabase
          .from('support_conversations')
          .update({ requires_human: false, updated_at: now })
          .eq('id', conversation_id);

        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Unknown action specified' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err: any) {
    console.error('Admin support API error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
