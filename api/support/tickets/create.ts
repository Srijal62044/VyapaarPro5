import { createClient } from '@supabase/supabase-js';

export function generateTicketNumber(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `VP-TCK-${num}`;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      subject,
      message,
      category = 'General',
      priority = 'normal',
      order_id,
      guest_name,
      guest_email,
      guest_phone,
    } = body;

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Subject and message are required.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

    // Authenticate user if Bearer token present
    let authenticatedUser: any = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ') && supabase) {
      const token = authHeader.substring(7);
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) authenticatedUser = user;
      } catch (err) {}
    }

    const ticketNumber = generateTicketNumber();
    const now = new Date().toISOString();

    if (supabase) {
      // 1. Insert ticket
      const { data: ticket, error: ticketErr } = await supabase
        .from('support_tickets')
        .insert({
          ticket_number: ticketNumber,
          user_id: authenticatedUser?.id || null,
          guest_name: guest_name || null,
          guest_email: guest_email || authenticatedUser?.email || null,
          guest_phone: guest_phone || null,
          subject: subject.trim(),
          message: message.trim(),
          category,
          priority,
          status: 'open',
          order_id: order_id || null,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (ticketErr || !ticket) {
        console.error('Failed to insert ticket:', ticketErr);
        throw new Error(ticketErr?.message || 'Database failed to create ticket');
      }

      // 2. Insert initial ticket message
      await supabase.from('support_ticket_messages').insert({
        ticket_id: ticket.id,
        sender_type: 'customer',
        sender_id: authenticatedUser?.id || null,
        sender_name: guest_name || authenticatedUser?.user_metadata?.full_name || 'Customer',
        message: message.trim(),
        is_internal: false,
        created_at: now,
      });

      return res.status(200).json({
        success: true,
        ticket,
      });
    }

    // In-memory fallback
    const fallbackTicket = {
      id: `tck-${Date.now()}`,
      ticket_number: ticketNumber,
      user_id: authenticatedUser?.id || null,
      guest_name,
      guest_email,
      guest_phone,
      subject: subject.trim(),
      message: message.trim(),
      category,
      priority,
      status: 'open',
      order_id,
      created_at: now,
      updated_at: now,
    };

    return res.status(200).json({
      success: true,
      ticket: fallbackTicket,
    });
  } catch (err: any) {
    console.error('Create ticket error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create support ticket' });
  }
}
