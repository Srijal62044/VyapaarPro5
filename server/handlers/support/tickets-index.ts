import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

    // Authenticate user
    let authenticatedUser: any = null;
    let isAdmin = false;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ') && supabase) {
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

    const { id, status, category } = req.query;

    if (!supabase) {
      return res.status(200).json({ tickets: [] });
    }

    // 1. Fetch single ticket with messages
    if (id) {
      const { data: ticket, error: ticketErr } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (ticketErr || !ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      // Security check: non-admin can only view their own ticket
      if (!isAdmin && ticket.user_id && ticket.user_id !== authenticatedUser?.id) {
        return res.status(403).json({ error: 'Unauthorized to view this ticket' });
      }

      // Fetch messages (exclude internal notes for regular customers)
      let msgQuery = supabase
        .from('support_ticket_messages')
        .select('*')
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });

      if (!isAdmin) {
        msgQuery = msgQuery.eq('is_internal', false);
      }

      const { data: messages } = await msgQuery;

      return res.status(200).json({
        ticket: {
          ...ticket,
          messages: messages || [],
        },
      });
    }

    // 2. Fetch list of tickets
    let query = supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    // If not admin, restrict to authenticated user's own tickets
    if (!isAdmin) {
      if (!authenticatedUser) {
        return res.status(200).json({ tickets: [] });
      }
      query = query.eq('user_id', authenticatedUser.id);
    } else {
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
    }

    const { data: tickets, error: listErr } = await query;
    if (listErr) {
      throw listErr;
    }

    return res.status(200).json({ tickets: tickets || [] });
  } catch (err: any) {
    console.error('Support tickets query error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
