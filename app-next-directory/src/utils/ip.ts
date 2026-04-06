import validator from 'validator';

/**
 * Interface for request objects that might contain IP or headers.
 * Supports standard Request, and also simple objects with headers/ip.
 */
export interface RequestLike {
  ip?: string;
  headers?: {
    get?: (name: string) => string | null | undefined;
  } | Headers | Record<string, string | string[] | undefined>;
}

/**
 * Extracts a safe client IP address from a request.
 * Prioritizes 'x-forwarded-for', then 'x-real-ip', then 'cf-connecting-ip'.
 * Uses validator.isIP to ensure return values are legitimate IP addresses.
 *
 * @param request The incoming request object
 * @returns A validated IP address string, or 'unknown' if none found.
 */
export function getClientIp(request: RequestLike | Request): string {
  // 1. Try request.ip directly (often set by Next.js or proxies)
  if ('ip' in request && request.ip && validator.isIP(request.ip)) {
    return request.ip;
  }

  // Helper to get header value regardless of header object type
  const getHeader = (name: string): string | null => {
    if (!request.headers) return null;

    const headers = request.headers;
    if (typeof (headers as Headers).get === 'function') {
      return (headers as Headers).get(name);
    }

    const headersMap = headers as Record<string, string | string[] | undefined>;
    const value = headersMap[name] || headersMap[name.toLowerCase()];
    if (Array.isArray(value)) return value[0] || null;
    return value || null;
  };

  // 2. Try x-forwarded-for
  const xForwardedFor = getHeader('x-forwarded-for');
  if (xForwardedFor) {
    const [first] = xForwardedFor.split(',');
    if (first) {
      const ip = first.trim();
      if (validator.isIP(ip)) return ip;
    }
  }

  // 3. Try x-real-ip
  const xRealIp = getHeader('x-real-ip');
  if (xRealIp && validator.isIP(xRealIp)) {
    return xRealIp;
  }

  // 4. Try cf-connecting-ip
  const cfConnectingIp = getHeader('cf-connecting-ip');
  if (cfConnectingIp && validator.isIP(cfConnectingIp)) {
    return cfConnectingIp;
  }

  return 'unknown';
}
