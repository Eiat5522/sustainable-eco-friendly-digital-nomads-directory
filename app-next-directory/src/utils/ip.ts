import validator from 'validator';

/**
 * Extracts the client IP address from the request.
 *
 * Prioritizes:
 * 1. request.ip (Next.js/middleware context)
 * 2. x-forwarded-for (first IP in the list)
 * 3. x-real-ip
 * 4. cf-connecting-ip (Cloudflare)
 *
 * All extracted values are validated using validator.isIP to prevent IP spoofing.
 *
 * @param request - The incoming HTTP request or a headers-like object
 * @returns The client IP address, or 'unknown' if none found
 */
export function getClientIp(request: {
  ip?: string;
  headers: { get(name: string): string | null }
}): string {
  try {
    // Prefer direct IP from request object (e.g. NextRequest in middleware)
    if (request.ip && validator.isIP(request.ip)) {
      return request.ip;
    }

    const xf = request.headers.get('x-forwarded-for');
    if (xf) {
      const first = (xf.split(',')[0] || '').trim();
      if (first && validator.isIP(first)) {
        return first;
      }
    }

    const xr = request.headers.get('x-real-ip');
    if (xr) {
      const ip = xr.trim();
      if (ip && validator.isIP(ip)) {
        return ip;
      }
    }

    const cf = request.headers.get('cf-connecting-ip');
    if (cf) {
      const ip = cf.trim();
      if (ip && validator.isIP(ip)) {
        return ip;
      }
    }
  } catch (_error) {
    // Graceful fallback
  }

  return 'unknown';
}
