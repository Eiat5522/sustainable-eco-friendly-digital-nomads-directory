import validator from 'validator';

export type HeaderGetter = (name: string) => string | null | undefined;
export type HeaderValue = string | string[] | undefined;
export type HeaderCollection =
  | Headers
  | Map<string, string>
  | (Record<string, HeaderValue> & { get?: HeaderGetter });

/**
 * Safely extracts a header value from various header collection types.
 */
export function getHeaderValue(
  headers: HeaderCollection | undefined,
  name: string
): string | undefined {
  if (!headers) return undefined;

  const lower = name.toLowerCase();

  // 1. Try 'get' method (Headers, Map, or custom)
  if ('get' in headers && typeof headers.get === 'function') {
    try {
      const value = headers.get(name) ?? headers.get(lower);
      if (typeof value === 'string') return value;
    } catch { /* ignore */ }
  }

  // 2. Try direct property access (Plain objects)
  const record = headers as Record<string, HeaderValue>;
  const val = record[name] || record[lower];

  if (typeof val === 'string') return val;

  if (Array.isArray(val)) {
    for (let i = 0; i < val.length; i++) {
      const entry = val[i];
      if (typeof entry === 'string') return entry;
    }
  }

  return undefined;
}

/**
 * Extracts the first valid client IP address from request headers.
 * Uses a clear pattern to satisfy security audits while maintaining flexibility.
 */
export function getClientIPFromHeaders(headers: HeaderCollection | undefined): string {
  if (!headers) return 'unknown';

  // Check common headers in order of preference
  const xff = getHeaderValue(headers, 'x-forwarded-for');
  if (xff) {
    const list = xff.split(',');
    for (let i = 0; i < list.length; i++) {
      const part = (list[i] || '').trim();
      if (part && validator.isIP(part)) return part;
    }
  }

  const xri = getHeaderValue(headers, 'x-real-ip');
  if (xri && validator.isIP(xri.trim())) return xri.trim();

  const cf = getHeaderValue(headers, 'cf-connecting-ip');
  if (cf && validator.isIP(cf.trim())) return cf.trim();

  return 'unknown';
}
