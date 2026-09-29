import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

  try {
    // GET /api/support/settings
    if (req.method === 'GET') {
      const defaultSettings = {
        id: 'default',
        is_enabled: true,
        welcome_message: 'Hello! I am VyapaarPro AI Support. Ask me about our custom web development, mobile apps, social media growth services, store products, or your orders.',
        fallback_message: 'I do not have enough verified information to answer that accurately. Would you like me to connect you with our team or create a support ticket?',
        system_instructions: 'You are the official AI Support specialist for VyapaarPro (https://vyapaarpro.in). You provide friendly, concise, and 100% accurate responses in English or Hindi/Hinglish based on the customer query. Never invent prices or unavailable services. Never request passwords, OTPs, or private keys.',
        max_messages_per_conversation: 30,
        rate_limit_per_minute: 10,
        human_handoff_enabled: true,
        allowed_knowledge_sources: ['services', 'store_products', 'faqs', 'policies', 'orders'],
        support_email: 'support@vyapaarpro.in',
        support_phone: '+91 98765 43210',
        custom_knowledge: '',
        has_server_gemini_key: Boolean(process.env.GEMINI_API_KEY || process.env.AI_API_KEY),
      };

      if (!supabase) {
        return res.status(200).json({ settings: defaultSettings });
      }

      const { data, error } = await supabase
        .from('ai_support_settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (error || !data) {
        return res.status(200).json({ settings: defaultSettings });
      }

      return res.status(200).json({
        settings: {
          ...defaultSettings,
          ...data,
          has_server_gemini_key: Boolean(process.env.GEMINI_API_KEY || process.env.AI_API_KEY),
        },
      });
    }

    // POST /api/support/settings (Admin Only)
    if (req.method === 'POST') {
      let isAdmin = false;
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ') && supabase) {
        const token = authHeader.substring(7);
        try {
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user) {
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

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const {
        is_enabled,
        welcome_message,
        fallback_message,
        system_instructions,
        max_messages_per_conversation,
        rate_limit_per_minute,
        human_handoff_enabled,
        allowed_knowledge_sources,
        support_email,
        support_phone,
        custom_knowledge,
      } = body;

      const updates = {
        id: 'default',
        is_enabled: is_enabled !== undefined ? Boolean(is_enabled) : true,
        welcome_message: welcome_message || undefined,
        fallback_message: fallback_message || undefined,
        system_instructions: system_instructions || undefined,
        max_messages_per_conversation: Number(max_messages_per_conversation) || 30,
        rate_limit_per_minute: Number(rate_limit_per_minute) || 10,
        human_handoff_enabled: human_handoff_enabled !== undefined ? Boolean(human_handoff_enabled) : true,
        allowed_knowledge_sources: Array.isArray(allowed_knowledge_sources) ? allowed_knowledge_sources : undefined,
        support_email: support_email || undefined,
        support_phone: support_phone || undefined,
        custom_knowledge: custom_knowledge !== undefined ? custom_knowledge : undefined,
        updated_at: new Date().toISOString(),
      };

      if (supabase) {
        const { data: saved, error: saveErr } = await supabase
          .from('ai_support_settings')
          .upsert(updates, { onConflict: 'id' })
          .select()
          .single();

        if (saveErr) throw saveErr;

        return res.status(200).json({ success: true, settings: saved });
      }

      return res.status(200).json({ success: true, settings: updates });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err: any) {
    console.error('AI settings error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
