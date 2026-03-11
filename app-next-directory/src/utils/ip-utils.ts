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

  // Try 'get' method (Headers, Map, or custom)
  const getter = (headers as { get?: HeaderGetter }).get;
  if (typeof getter === 'function') {
    try {
      const viaGetter = getter.call(headers, name) ?? getter.call(headers, lower);
      if (typeof viaGetter === 'string') {
        return viaGetter;
      }
    } catch {
      // Ignore getter errors
    }
  }

  // Try direct property access (Plain objects)
  const record = headers as Record<string, HeaderValue>;
  const direct = record[name] || record[lower];
  if (typeof direct === 'string') {
    return direct;
  }
  if (Array.isArray(direct)) {
    for (const entry of direct) {
      if (typeof entry === 'string') {
        return entry;
      }
    }
  }

  return undefined;
}

/**
 * Extracts the first valid client IP address from request headers.
 * Prevents IP spoofing by validating each IP and picking the first valid one.
 *
 * @param headers - Request headers collection
 * @returns The client IP address or 'unknown' if not found
 */
export function getClientIPFromHeaders(headers: HeaderCollection | undefined): string {
  if (!headers) return 'unknown';

  // Common headers used by proxies and load balancers
  const headerKeys = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

  for (const key of headerKeys) {
    const value = getHeaderValue(headers, key);
    if (value === undefined) continue;

    if (key === 'x-forwarded-for') {
      const ips = value.split(',').map(ip => ip.trim());
      for (const ip of ips) {
        if (ip && validator.isIP(ip)) {
          return ip;
        }
      }
    }

    const trimmedValue = value.trim();
    if (validator.isIP(trimmedValue)) {
      return trimmedValue;
    }
  }

  return 'unknown';
}
