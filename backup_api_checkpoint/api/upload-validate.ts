import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { user_id, files } = body;

    const clientIp =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.headers['x-real-ip']?.toString() ||
      req.headers['cf-connecting-ip']?.toString() ||
      req.socket?.remoteAddress ||
      'anonymous-ip';

    const rateLimitIdentifier = user_id ? `user:${user_id}` : `ip:${clientIp}`;
    const rateLimitKey = `file_upload:${rateLimitIdentifier}`;

    // 1. Validate files metadata
    if (files && Array.isArray(files)) {
      const ALLOWED_MIME_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
      ];
      const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.webp'];
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB

      if (files.length > 5) {
        return res.status(400).json({ error: 'Maximum 5 files can be attached at a time.' });
      }

      let total = 0;
      for (const f of files) {
        if (f.size > MAX_FILE_SIZE) {
          return res.status(400).json({ error: `File "${f.name}" exceeds 10MB limit.` });
        }
        total += f.size || 0;
        const name = (f.name || '').toLowerCase();
        const hasExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
        const hasMime = !f.type || ALLOWED_MIME_TYPES.includes(f.type.toLowerCase());
        if (!hasExt && !hasMime) {
          return res.status(400).json({
            error: `File "${f.name}" has an unsupported format. Allowed: PDF, DOC, DOCX, PNG, JPG, WEBP.`,
          });
        }
      }
      if (total > MAX_TOTAL_SIZE) {
        return res.status(400).json({ error: 'Total file size exceeds 25MB.' });
      }
    }

    // 2. Server-Side Rate Limit: 10 uploads per hour
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

      return res.status(200).json({
        allowed: true,
        remaining: rlData ? rlData.remaining : 9,
      });
    }

    return res.status(200).json({ allowed: true, remaining: 9 });
  } catch (err: any) {
    console.error('Upload validate API Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
