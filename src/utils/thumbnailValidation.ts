/**
 * VyapaarPro Service Thumbnail Validation Utility
 * Enforces secure external image URLs without allowing Supabase Storage or binary files.
 * Rejects javascript:, data:, file:, localhost, internal networks, and malformed URLs.
 */

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedUrl?: string;
  isHttps?: boolean;
}

/**
 * Validates a thumbnail image URL.
 * Accepts normal HTTPS (and HTTP) external image URLs.
 * Rejects javascript:, data:, file:, blob:, localhost, internal networks, and malformed URLs.
 * Returns isValid: true with empty sanitizedUrl if input is empty (allowing thumbnail removal).
 */
export function validateThumbnailUrl(url: string | null | undefined): UrlValidationResult {
  if (!url || typeof url !== 'string') {
    return { isValid: true, sanitizedUrl: '' };
  }

  const trimmed = url.trim();
  if (trimmed === '') {
    return { isValid: true, sanitizedUrl: '' };
  }

  const lower = trimmed.toLowerCase();

  // Reject dangerous protocols and injections
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('blob:')
  ) {
    return {
      isValid: false,
      error: 'Invalid URL format: "javascript:", "data:", and "file:" protocols are not allowed.',
    };
  }

  // Parse URL safely
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      error: 'Malformed URL: Please provide a valid external URL starting with https://',
    };
  }

  // Reject non-web protocols
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return {
      isValid: false,
      error: 'Invalid protocol: Only HTTPS (preferred) or HTTP web URLs are accepted.',
    };
  }

  // Disallow localhost and internal network addresses
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.test')
  ) {
    return {
      isValid: false,
      error: 'Localhost and private internal network URLs are not allowed.',
    };
  }

  // Must have a valid dot-separated hostname
  if (!hostname.includes('.')) {
    return {
      isValid: false,
      error: 'Invalid domain name in URL.',
    };
  }

  return {
    isValid: true,
    sanitizedUrl: trimmed,
    isHttps: parsed.protocol === 'https:',
  };
}
