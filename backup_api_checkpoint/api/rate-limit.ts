import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function for distributed rate limiting
export default async function handler(req: any, res: any) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { action, identifier } = body;

    if (!action) {
      return res.status(400).json({ error: 'Action parameter is required' });
    }

    // Extract real client IP on Vercel / Cloudflare
    const clientIp =
      req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
      req.headers['x-real-ip']?.toString() ||
      req.headers['cf-connecting-ip']?.toString() ||
      req.socket?.remoteAddress ||
      'anonymous-ip';

    const cleanId = (identifier || clientIp).toLowerCase().trim();
    const rateLimitKey = `${action}:${cleanId}`;

    const RATE_LIMIT_RULES: Record<string, { maxRequests: number; windowSeconds: number }> = {
      signup: { maxRequests: 5, windowSeconds: 900 },
      login: { maxRequests: 10, windowSeconds: 900 },
      forgot_password: { maxRequests: 3, windowSeconds: 900 },
      contact: { maxRequests: 5, windowSeconds: 600 },
      service_request: { maxRequests: 10, windowSeconds: 3600 },
      file_upload: { maxRequests: 10, windowSeconds: 3600 },
      store_checkout: { maxRequests: 10, windowSeconds: 900 },
      store_payment_verify: { maxRequests: 15, windowSeconds: 900 },
      store_download: { maxRequests: 30, windowSeconds: 900 },
      store_product_upload: { maxRequests: 10, windowSeconds: 3600 },
    };

    const rule = RATE_LIMIT_RULES[action] || { maxRequests: 10, windowSeconds: 900 };

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      '';

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
        p_key: rateLimitKey,
        p_max_requests: rule.maxRequests,
        p_window_seconds: rule.windowSeconds,
      });

      if (!error && data) {
        if (data.allowed === false) {
          res.setHeader('Retry-After', data.retry_after || 60);
          return res.status(429).json({
            allowed: false,
            error: 'Too many requests. Please try again later.',
            retryAfter: data.retry_after,
          });
        }

        return res.status(200).json({
          allowed: true,
          remaining: data.remaining,
        });
      }
    }

    // Default allow if database unconfigured in local preview
    return res.status(200).json({ allowed: true, remaining: rule.maxRequests - 1 });
  } catch (err: any) {
    console.error('Rate limit API handler error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
