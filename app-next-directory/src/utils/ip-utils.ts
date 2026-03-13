import validator from 'validator';

/**
 * Collection of headers from Next.js (can be Headers, Map, or Record)
 */
export type HeaderCollection =
  | Headers
  | Map<string, string | string[]>
  | Record<string, string | string[] | undefined>;

/**
 * Helper to get a header value regardless of the collection type.
 * Returns the first value if it's an array, or the string value.
 */
export function getHeaderValue(headers: HeaderCollection | undefined, name: string): string | null {
  if (!headers) return null;

  // 1. Support Headers object (or anything with a get method)
  if (typeof (headers as any).get === 'function') {
    const val = (headers as any).get(name);
    if (Array.isArray(val)) return val[0] !== undefined ? String(val[0]) : null;
    return val !== undefined && val !== null ? String(val) : null;
  }

  // 2. Support Map
  if (headers instanceof Map) {
    const val = headers.get(name);
    if (val === undefined || val === null) return null;
    return Array.isArray(val) ? (val[0] !== undefined ? String(val[0]) : null) : String(val);
  }

  // 3. Support Record
  const val = (headers as Record<string, any>)[name];
  if (val === undefined || val === null) return null;
  return Array.isArray(val) ? (val[0] !== undefined ? String(val[0]) : null) : String(val);
}

/**
 * Extracts the first valid IP address from request headers.
 * Implements protection against IP spoofing by validating extracted values.
 *
 * @param headers - The request headers
 * @returns The validated client IP address, or 'unknown' if none found
 */
export function getClientIPFromHeaders(headers: HeaderCollection | undefined): string {
  if (!headers) return 'unknown';

  // Ordered by priority
  const headerNames = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

  for (const name of headerNames) {
    let value: string | null = null;

    // For x-forwarded-for, we ALWAYS want the full string so we can split it
    if (name === 'x-forwarded-for') {
        if (typeof (headers as any).get === 'function') {
            const rawVal = (headers as any).get(name);
            if (rawVal !== undefined && rawVal !== null) {
                value = String(rawVal);
            }
        } else if (headers instanceof Map) {
            const rawValue = headers.get(name);
            if (Array.isArray(rawValue)) {
                value = rawValue.join(', ');
            } else if (rawValue !== undefined && rawValue !== null) {
                value = String(rawValue);
            }
        } else {
            const rawValue = (headers as Record<string, any>)[name];
            if (Array.isArray(rawValue)) {
                value = rawValue.join(', ');
            } else if (rawValue !== undefined && rawValue !== null) {
                value = String(rawValue);
            }
        }
    } else {
        value = getHeaderValue(headers, name);
    }

    if (!value) continue;

    if (name === 'x-forwarded-for') {
      const parts = value.split(',');
      const firstIp = (parts[0] || '').trim();
      if (firstIp && validator.isIP(firstIp)) {
        return firstIp;
      }
    } else {
      const trimmed = value.trim();
      if (validator.isIP(trimmed)) {
        return trimmed;
      }
    }
  }

  return 'unknown';
}
