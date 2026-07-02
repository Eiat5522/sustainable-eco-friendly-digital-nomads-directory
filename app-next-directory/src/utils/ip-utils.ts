import validator from 'validator';

/**
 * Common interface for request objects that might have headers or an ip property.
 * Supports standard Request, NextRequest, and custom RequestLike objects.
 */
export interface RequestLike {
  headers?: {
    get(name: string): string | null | undefined;
  } | Headers | Map<string, string> | Record<string, string | string[] | undefined>;
  ip?: string;
}

/**
 * Safely extracts a header value from various header collection types.
 */
function getHeaderValue(headers: RequestLike['headers'], name: string): string | undefined {
  if (!headers) return undefined;

  // Case 1: Headers-like object with a get() method
  const h = headers as { get?: (name: string) => string | null | undefined };
  if (typeof h.get === 'function') {
    const val = h.get(name) ?? h.get(name.toLowerCase());
    return typeof val === 'string' ? val : undefined;
  }

  // Case 2: Record/Object
  const record = headers as Record<string, string | string[] | undefined>;
  const val = record[name] ?? record[name.toLowerCase()];

  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val[0];

  return undefined;
}

/**
 * Extracts and validates the client IP address from a request.
 *
 * Checks in order:
 * 1. req.ip (trusted property if available)
 * 2. x-forwarded-for (first IP in the list)
 * 3. x-real-ip
 * 4. cf-connecting-ip (Cloudflare)
 *
 * @param req - The incoming request
 * @returns The validated client IP address, or 'unknown' if none found or invalid
 */
export function getClientIp(req: RequestLike | undefined): string {
  if (!req) return 'unknown';

  // 1. Try trusted IP property if available
  if (req.ip && validator.isIP(req.ip)) {
    return req.ip;
  }

  const headers = req.headers;
  if (!headers) return 'unknown';

  // 2. Try x-forwarded-for
  const xf = getHeaderValue(headers, 'x-forwarded-for');
  if (xf) {
    const first = xf.split(',')[0]?.trim();
    if (first && validator.isIP(first)) {
      return first;
    }
  }

  // 3. Try x-real-ip
  const xr = getHeaderValue(headers, 'x-real-ip');
  if (xr && validator.isIP(xr)) {
    return xr;
  }

  // 4. Try cf-connecting-ip
  const cf = getHeaderValue(headers, 'cf-connecting-ip');
  if (cf && validator.isIP(cf)) {
    return cf;
  }

  return 'unknown';
}
