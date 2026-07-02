import validator from 'validator';

/**
 * Collection of headers that might contain the client IP
 */
export type HeaderCollection =
  | Headers
  | Map<string, string>
  | Record<string, string | string[] | undefined>
  | { get(name: string): string | null | undefined };

/**
 * Safely gets a header value from various types of header collections
 */
export function getHeaderValue(headers: HeaderCollection, name: string): string | null {
  if (!headers) return null;

  if (typeof (headers as any).get === 'function') {
    return (headers as any).get(name) || null;
  }

  const value = (headers as any)[name];
  if (Array.isArray(value)) {
    return value[0] || null;
  }
  return value || null;
}

/**
 * Extracts and validates the client IP address from request headers.
 *
 * Checks in order:
 * 1. x-forwarded-for (all valid IPs in list, return first valid)
 * 2. x-real-ip
 * 3. cf-connecting-ip
 *
 * @param headers - The request headers
 * @returns The validated IP address, or 'unknown' if none found/valid
 */
export function getClientIPFromHeaders(headers: HeaderCollection): string {
  // 1. x-forwarded-for
  const xff = getHeaderValue(headers, 'x-forwarded-for');
  if (xff) {
    const IPs = xff.split(',');
    for (const rawIP of IPs) {
      const ip = rawIP.trim();
      if (ip && validator.isIP(ip)) {
        return ip;
      }
    }
  }

  // 2. x-real-ip
  const xri = getHeaderValue(headers, 'x-real-ip');
  if (xri) {
    const ip = xri.trim();
    if (ip && validator.isIP(ip)) {
      return ip;
    }
  }

  // 3. cf-connecting-ip (Cloudflare)
  const cf = getHeaderValue(headers, 'cf-connecting-ip');
  if (cf) {
    const ip = cf.trim();
    if (ip && validator.isIP(ip)) {
      return ip;
    }
  }

  return 'unknown';
}
