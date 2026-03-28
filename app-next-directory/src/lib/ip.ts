import validator from 'validator';

/**
 * Minimal interface for objects that look like a Request and have headers.
 * This ensures compatibility with standard Request, NextRequest, and custom mocks.
 */
export interface RequestLike {
  headers: {
    get(name: string): string | null | undefined;
  };
  ip?: string;
}

/**
 * Extracts the client IP address from the request headers or object properties.
 *
 * It checks headers in the following priority:
 * 1. x-forwarded-for (first valid IP in the list)
 * 2. x-real-ip
 * 3. cf-connecting-ip (Cloudflare)
 * 4. req.ip property (commonly set by Next.js/Express)
 *
 * Each extracted value is strictly validated using validator.isIP.
 *
 * @param req - The incoming request-like object
 * @returns The first valid client IP address, or 'unknown' if none found
 */
export function getClientIp(req: RequestLike | undefined | null): string {
  if (!req) return 'unknown';

  try {
    // 1. Check x-forwarded-for (priority for proxies)
    const xf = req.headers.get('x-forwarded-for');
    if (xf) {
      const first = (xf.split(',')[0] || '').trim();
      if (first && validator.isIP(first)) {
        return first;
      }
    }

    // 2. Check x-real-ip
    const xr = req.headers.get('x-real-ip');
    if (xr && validator.isIP(xr)) {
      return xr;
    }

    // 3. Check cf-connecting-ip
    const cf = req.headers.get('cf-connecting-ip');
    if (cf && validator.isIP(cf)) {
      return cf;
    }

    // 4. Check direct ip property
    if (req.ip && validator.isIP(req.ip)) {
      return req.ip;
    }
  } catch {
    // Silently fall through on any header access error
  }

  return 'unknown';
}
