import validator from 'validator';

/**
 * Interface representing a minimal request-like object with headers.
 */
export interface RequestLike {
  headers: {
    get: (name: string) => string | null | undefined;
  };
}

/**
 * Robustly extracts the client IP address from request headers.
 * Supports x-forwarded-for, x-real-ip, and cf-connecting-ip.
 * Validates the extracted IP address using validator.isIP to prevent spoofing.
 *
 * @param request - The incoming request or request-like object
 * @returns The validated client IP address, or 'unknown' if none found or invalid
 */
export function extractClientIp(request: RequestLike): string {
  try {
    // 1. x-forwarded-for (Standard for proxies/load balancers)
    // We take the first IP in the list and validate it.
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      const first = (forwarded.split(',')[0] || '').trim();
      if (first && validator.isIP(first)) {
        return first;
      }
    }

    // 2. x-real-ip (Common fallback)
    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
      const ip = realIp.trim();
      if (validator.isIP(ip)) {
        return ip;
      }
    }

    // 3. cf-connecting-ip (Cloudflare specific)
    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp) {
      const ip = cfIp.trim();
      if (validator.isIP(ip)) {
        return ip;
      }
    }
  } catch (_error) {
    // Ignore errors and fall through
  }

  return 'unknown';
}
