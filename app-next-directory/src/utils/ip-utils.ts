import validator from 'validator';

export type HeaderCollection = Headers | Map<string, string | string[]> | Record<string, string | string[] | undefined>;

/**
 * Extracts a header value from various header collection types
 */
function getHeaderValue(headers: HeaderCollection, name: string): string | null {
  if (headers instanceof Headers) {
    return headers.get(name);
  }
  if (headers instanceof Map) {
    const val = headers.get(name);
    if (Array.isArray(val)) return val[0] || null;
    return val || null;
  }
  const val = headers[name];
  if (Array.isArray(val)) return val[0] || null;
  return val || null;
}

/**
 * Extracts the first valid IP address from a request header
 */
export function getClientIPFromHeaders(headers: HeaderCollection): string {
  // Try various headers for IP address
  const headerKeys = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
  ];

  for (const key of headerKeys) {
    const value = getHeaderValue(headers, key);
    if (value) {
      // For x-forwarded-for, take the first IP
      const firstIp = (value.split(',')[0] || '').trim();
      if (validator.isIP(firstIp)) {
        return firstIp;
      }
    }
  }

  return 'unknown';
}
