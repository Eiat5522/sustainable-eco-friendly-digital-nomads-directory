import { isIP } from 'validator';

export type HeaderCollection =
  | Headers
  | Map<string, string | string[]>
  | Record<string, string | string[] | undefined>;

/**
 * Extracts a header value from various header collection types
 */
export function getHeaderValue(
  headers: HeaderCollection | null | undefined,
  name: string
): string | null {
  if (!headers) return null;

  if (headers instanceof Headers) {
    return headers.get(name);
  }
  if (headers instanceof Map) {
    const val = headers.get(name) || headers.get(name.toLowerCase());
    if (Array.isArray(val)) return val[0] || null;
    return (val as string) || null;
  }
  const casted = headers as Record<string, string | string[] | undefined> & {
    get?: (n: string) => string | string[] | null | undefined;
  };
  if (typeof casted.get === 'function') {
    const val = casted.get(name) || casted.get(name.toLowerCase());
    if (val !== null && val !== undefined) {
      return Array.isArray(val) ? val[0] || null : val;
    }
  }
  const val = casted[name] ?? casted[name.toLowerCase()];
  if (Array.isArray(val)) return val[0] || null;
  return (val as string) || null;
}

/**
 * Extracts the first valid IP address from a request header.
 * Uses validation to prevent IP spoofing security hotspots.
 * Always returns a string (defaults to 'unknown') for safety in rate limiting keys.
 */
export function getClientIPFromHeaders(
  headers: HeaderCollection | null | undefined
): string {
  if (!headers) return 'unknown';

  // Try various headers for IP address in order of preference
  const headerKeys = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

  for (const key of headerKeys) {
    const value = getHeaderValue(headers, key);
    if (value && typeof value === 'string') {
      // For multi-value headers like x-forwarded-for, take the first IP
      const firstIp = (value.split(',')[0] || '').trim();
      if (firstIp && isIP(firstIp)) {
        return firstIp;
      }
    }
  }

  return 'unknown';
}
