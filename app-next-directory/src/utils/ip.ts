import validator from 'validator';

/**
 * Common header collection shape that covers Headers, Maps, and plain objects.
 */
export type HeaderCollection =
  | Headers
  | Map<string, string>
  | (Record<string, string | string[] | undefined> & { get?: (name: string) => string | null | undefined });

/**
 * Minimal request interface for IP extraction.
 */
export interface RequestLike {
  method?: string;
  url?: string;
  path?: string;
  nextUrl?: { pathname?: string };
  headers?: HeaderCollection;
  ip?: string;
}

/**
 * Helper to extract a header value from various collection types.
 */
function getHeaderValue(headers: HeaderCollection | undefined, name: string): string | undefined {
  if (!headers) return undefined;

  const lower = name.toLowerCase();

  // Handle Headers object or object with get() method
  if ('get' in headers && typeof headers.get === 'function') {
    const viaGetter = headers.get(name) ?? headers.get(lower);
    if (typeof viaGetter === 'string') return viaGetter;
  }

  // Handle plain object or Map
  const record = headers as Record<string, string | string[] | undefined>;
  const direct = record[name] ?? record[lower];

  if (typeof direct === 'string') return direct;
  if (Array.isArray(direct)) {
    const first = direct.find((entry): entry is string => typeof entry === 'string');
    if (first) return first;
  }

  return undefined;
}

/**
 * Extracts the client IP address from the request.
 *
 * Checks multiple common headers used by proxies and load balancers:
 * - x-forwarded-for (first IP in the list)
 * - x-real-ip
 * - cf-connecting-ip (Cloudflare)
 *
 * Each extracted value is validated using validator.isIP to prevent IP spoofing
 * and satisfy security requirements.
 *
 * @param request - The incoming HTTP request or a request-like object
 * @returns The client IP address, or undefined if none found
 */
export function getClientIp(request: RequestLike | undefined | null): string | undefined {
  if (!request) return undefined;

  // If the request object already has a verified IP (e.g. from Next.js middleware)
  if (request.ip && validator.isIP(request.ip)) {
    return request.ip;
  }

  const headers = request.headers;
  if (!headers) return undefined;

  // 1. Check x-forwarded-for (standard for proxies)
  const forwarded = getHeaderValue(headers, 'x-forwarded-for');
  if (forwarded) {
    const first = (forwarded.split(',')[0] || '').trim();
    if (first && validator.isIP(first)) {
      return first;
    }
  }

  // 2. Check x-real-ip (common fallback)
  const realIP = getHeaderValue(headers, 'x-real-ip');
  if (realIP && validator.isIP(realIP)) {
    return realIP;
  }

  // 3. Check cf-connecting-ip (Cloudflare)
  const cfConnectingIP = getHeaderValue(headers, 'cf-connecting-ip');
  if (cfConnectingIP && validator.isIP(cfConnectingIP)) {
    return cfConnectingIP;
  }

  return undefined;
}
