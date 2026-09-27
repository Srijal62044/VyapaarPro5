import { createClient } from '@supabase/supabase-js';

function generateReferenceCode(prefix: 'VP-REQ'): string {
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
    const {
      service_id,
      service_name,
      client_name,
      client_email,
      client_phone,
      business_name,
      requirements,
      budget_range,
      preferred_contact_method,
      reference_links,
      user_id,
    } = body;

    // 1. Validation
    if (!client_name || typeof client_name !== 'string' || client_name.trim().length < 2) {
      return res.status(400).json({ error: 'Client name is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!client_email || typeof client_email !== 'string' || !emailRegex.test(client_email.trim())) {
      return res.status(400).json({ error: 'Valid client email address is required.' });
    }

    if (!client_phone || typeof client_phone !== 'string' || client_phone.trim().length < 6) {
      return res.status(400).json({ error: 'Valid client phone number is required.' });
    }

    if (!requirements || typeof requirements !== 'string' || requirements.trim().length < 5) {
      return res.status(400).json({ error: 'Requirements must be at least 5 characters.' });
    }

    // 2. Client IP or User ID for rate limiting
    const clientIp =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.headers['x-real-ip']?.toString() ||
      req.headers['cf-connecting-ip']?.toString() ||
      req.socket?.remoteAddress ||
      'anonymous-ip';

    const rateLimitIdentifier = user_id ? `user:${user_id}` : `ip:${clientIp}`;
    const rateLimitKey = `service_request:${rateLimitIdentifier}`;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Check rate limit: 10 requests per hour (3600 seconds)
      const { data: rlData, error: rlError } = await supabase.rpc('check_and_increment_rate_limit', {
        p_key: rateLimitKey,
        p_max_requests: 10,
        p_window_seconds: 3600,
      });

      if (!rlError && rlData && rlData.allowed === false) {
        res.setHeader('Retry-After', rlData.retry_after || 60);
        return res.status(429).json({
          error: 'Too many requests. Please try again later.',
          retryAfter: rlData.retry_after,
        });
      }

      const reference_code = generateReferenceCode('VP-REQ');
      const { data: inserted, error: insertError } = await supabase
        .from('service_requests')
        .insert({
          reference_code,
          user_id: user_id || null,
          service_id: service_id || null,
          service_name: service_name || 'Custom Digital Solution',
          client_name: client_name.trim(),
          client_email: client_email.toLowerCase().trim(),
          client_phone: client_phone.trim(),
          business_name: business_name ? business_name.trim() : null,
          requirements: requirements.trim(),
          budget_range: budget_range || null,
          preferred_contact_method: preferred_contact_method || 'WhatsApp',
          reference_links: reference_links ? reference_links.trim() : null,
          status: 'New',
          payment_status: 'Not Discussed',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        return res.status(500).json({ error: 'Failed to record service request in database.' });
      }

      return res.status(200).json({
        success: true,
        reference_code: inserted.reference_code,
        request: inserted,
      });
    }

    const reference_code = generateReferenceCode('VP-REQ');
    return res.status(200).json({
      success: true,
      reference_code,
    });
  } catch (err: any) {
    console.error('Service request API Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
