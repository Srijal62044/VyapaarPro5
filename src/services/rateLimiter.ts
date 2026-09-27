import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type RateLimitAction =
  | 'signup'
  | 'login'
  | 'forgot_password'
  | 'contact'
  | 'service_request'
  | 'file_upload';

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number; // in seconds
}

export const RATE_LIMIT_RULES: Record<RateLimitAction, RateLimitConfig> = {
  signup: { maxRequests: 5, windowSeconds: 900 }, // 5 attempts per 15 mins
  login: { maxRequests: 10, windowSeconds: 900 }, // 10 attempts per 15 mins
  forgot_password: { maxRequests: 3, windowSeconds: 900 }, // 3 requests per 15 mins
  contact: { maxRequests: 5, windowSeconds: 600 }, // 5 submissions per 10 mins
  service_request: { maxRequests: 10, windowSeconds: 3600 }, // 10 requests per hour
  file_upload: { maxRequests: 10, windowSeconds: 3600 }, // 10 uploads per hour
};

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  retryAfter?: number; // seconds to wait
  error?: string;
}

// Local storage fallback key prefix for offline/local environment
const LOCAL_RATE_LIMIT_PREFIX = 'vp_rl_';

export const rateLimiter = {
  /**
   * Evaluates rate limit for a specific action and identifier (IP or User ID / Session).
   * Enforces server-side distributed check via Supabase RPC check_and_increment_rate_limit.
   */
  async checkRateLimit(
    action: RateLimitAction,
    identifier?: string
  ): Promise<RateLimitResult> {
    const rule = RATE_LIMIT_RULES[action];
    if (!rule) {
      return { allowed: true };
    }

    const cleanId = (identifier || 'anonymous').toLowerCase().trim();
    const rateLimitKey = `${action}:${cleanId}`;

    // 1. Server-side Supabase Distributed Stored Procedure
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('check_and_increment_rate_limit', {
          p_key: rateLimitKey,
          p_max_requests: rule.maxRequests,
          p_window_seconds: rule.windowSeconds,
        });

        if (!error && data) {
          if (data.allowed === false) {
            return {
              allowed: false,
              remaining: 0,
              retryAfter: data.retry_after || 60,
              error: 'Too many requests. Please try again later.',
            };
          }
          return {
            allowed: true,
            remaining: data.remaining ?? rule.maxRequests - 1,
            retryAfter: 0,
          };
        }
      } catch (err) {
        console.warn('Supabase rate limit RPC notice:', err);
      }
    }

    // 2. Local Fallback (for unconfigured/offline dev mode)
    return this.checkLocalRateLimit(rateLimitKey, rule.maxRequests, rule.windowSeconds);
  },

  /**
   * Atomic local storage rate limiting fallback for offline dev mode
   */
  checkLocalRateLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number
  ): RateLimitResult {
    try {
      const storageKey = `${LOCAL_RATE_LIMIT_PREFIX}${key}`;
      const now = Date.now();
      const raw = localStorage.getItem(storageKey);

      if (!raw) {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ count: 1, expiresAt: now + windowSeconds * 1000 })
        );
        return { allowed: true, remaining: maxRequests - 1 };
      }

      const record: { count: number; expiresAt: number } = JSON.parse(raw);

      if (now >= record.expiresAt) {
        // Window expired, reset
        localStorage.setItem(
          storageKey,
          JSON.stringify({ count: 1, expiresAt: now + windowSeconds * 1000 })
        );
        return { allowed: true, remaining: maxRequests - 1 };
      }

      if (record.count >= maxRequests) {
        const retryAfter = Math.max(1, Math.ceil((record.expiresAt - now) / 1000));
        return {
          allowed: false,
          remaining: 0,
          retryAfter,
          error: 'Too many requests. Please try again later.',
        };
      }

      // Increment count
      record.count += 1;
      localStorage.setItem(storageKey, JSON.stringify(record));
      return { allowed: true, remaining: maxRequests - record.count };
    } catch {
      return { allowed: true };
    }
  },

  /**
   * Validates file upload sizes and MIME types.
   * Allowed: PDF, DOC, DOCX, PNG, JPG, JPEG, WEBP.
   * Max 10MB per file, max 25MB total.
   */
  validateFiles(files: File[]): { valid: boolean; error?: string } {
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

    if (!files || files.length === 0) {
      return { valid: true };
    }

    if (files.length > 5) {
      return { valid: false, error: 'Maximum 5 files can be attached at a time.' };
    }

    let totalSize = 0;

    for (const file of files) {
      totalSize += file.size;

      if (file.size > MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `File "${file.name}" exceeds the maximum allowed size of 10MB.`,
        };
      }

      const fileName = file.name.toLowerCase();
      const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
      const hasValidMime = !file.type || ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());

      if (!hasValidExt && !hasValidMime) {
        return {
          valid: false,
          error: `File "${file.name}" has an unsupported format. Allowed: PDF, DOC, DOCX, PNG, JPG, WEBP.`,
        };
      }
    }

    if (totalSize > MAX_TOTAL_SIZE) {
      return {
        valid: false,
        error: 'Total attached file size exceeds 25MB.',
      };
    }

    return { valid: true };
  },
};
