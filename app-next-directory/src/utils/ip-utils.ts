import validator from 'validator';

/**
 * Collection of headers from Next.js (can be Headers, Map, or Record)
 */
export type HeaderCollection =
  | Headers
  | Map<string, string | string[]>
  | Record<string, string | string[] | undefined>;

/**
 * Helper to get a header value regardless of the collection type
 */
export function getHeaderValue(headers: HeaderCollection, name: string): string | null {
  if (headers instanceof Headers) {
    return headers.get(name);
  }
  if (headers instanceof Map) {
    const value = headers.get(name);
    if (value === undefined) return null;
    const result = Array.isArray(value) ? value[0] : value;
    return result ?? null;
  }
  const value = headers[name];
  if (value === undefined) return null;
  const result = Array.isArray(value) ? value[0] : value;
  return result ?? null;
}

/**
 * Extracts the first valid IP address from request headers.
 * Implements protection against IP spoofing by validating extracted values.
 *
 * @param headers - The request headers
 * @returns The validated client IP address, or 'unknown' if none found
 */
export function getClientIPFromHeaders(headers: HeaderCollection): string {
  // Ordered by priority
  const headerNames = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

  for (const name of headerNames) {
    const value = getHeaderValue(headers, name);
    if (!value) continue;

    if (name === 'x-forwarded-for') {
      // x-forwarded-for can contain multiple IPs, take the first one
      const firstIp = (value.split(',')[0] || '').trim();
      if (firstIp && validator.isIP(firstIp)) {
        return firstIp;
      }
    } else if (validator.isIP(value.trim())) {
      return value.trim();
    }
  }

  return 'unknown';
}
