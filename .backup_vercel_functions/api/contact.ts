import { createClient } from '@supabase/supabase-js';

// Helper to generate reference numbers (e.g. VP-MSG-8F3A29B1)
function generateReferenceCode(prefix: 'VP-MSG'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let random = '';
  for (let i = 0; i < 8; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${random}`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { name, email, phone, subject, message, _hp_security_check } = body;

    // 1. Honeypot Spam Protection: If hidden field is filled, reject silently (simulate success or 400 to fool spam bots)
    if (_hp_security_check) {
      return res.status(200).json({
        success: true,
        reference_code: generateReferenceCode('VP-MSG'),
      });
    }

    // 2. Server-side Input Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length < 2 || subject.trim().length > 250) {
      return res.status(400).json({ error: 'Subject must be between 2 and 250 characters.' });
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5 || message.trim().length > 5000) {
      return res.status(400).json({ error: 'Message must be between 5 and 5000 characters.' });
    }

    // 3. Extract Real Client IP on Vercel
    const clientIp =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.headers['x-real-ip']?.toString() ||
      req.headers['cf-connecting-ip']?.toString() ||
      req.socket?.remoteAddress ||
      'anonymous-ip';

    const rateLimitKey = `contact:${clientIp.toLowerCase().trim()}`;

    // 4. Server-Side Rate Limit Enforcement (5 submissions / 10 minutes)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: rlData, error: rlError } = await supabase.rpc('check_and_increment_rate_limit', {
        p_key: rateLimitKey,
        p_max_requests: 5,
        p_window_seconds: 600, // 10 mins
      });

      if (!rlError && rlData && rlData.allowed === false) {
        res.setHeader('Retry-After', rlData.retry_after || 60);
        return res.status(429).json({
          error: 'Too many requests. Please try again later.',
          retryAfter: rlData.retry_after,
        });
      }

      // Insert record
      const reference_code = generateReferenceCode('VP-MSG');
      const { data: inserted, error: insertError } = await supabase
        .from('contact_messages')
        .insert({
          reference_code,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone ? phone.trim() : null,
          subject: subject.trim(),
          message: message.trim(),
          status: 'Unread',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        return res.status(500).json({ error: 'Failed to record message in database.' });
      }

      return res.status(200).json({
        success: true,
        reference_code: inserted.reference_code,
        message: inserted,
      });
    }

    // Fallback if Supabase not configured in local environment
    const reference_code = generateReferenceCode('VP-MSG');
    return res.status(200).json({
      success: true,
      reference_code,
      message: {
        reference_code,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        created_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Contact API Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
