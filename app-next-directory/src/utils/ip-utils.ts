import validator from 'validator';

/**
 * Collection of header types supported by getClientIPFromHeaders
 */
export type HeaderCollection =
  | Headers
  | Map<string, string | string[] | undefined>
  | Record<string, string | string[] | undefined>;

/**
 * Helper to get a header value regardless of the collection type
 */
export function getHeaderValue(headers: HeaderCollection, name: string): string | undefined {
  if (headers instanceof Headers) {
    return headers.get(name) || undefined;
  }
  if (headers instanceof Map) {
    const val = headers.get(name);
    return Array.isArray(val) ? val.join(',') : val;
  }
  const val = headers[name];
  return Array.isArray(val) ? val.join(',') : val;
}

/**
 * Extracts and validates the client IP address from request headers.
 * Addresses SonarCloud security requirements by using validator.isIP.
 *
 * @param headers - The request headers
 * @returns Validated IP address or 'unknown'
 */
export function getClientIPFromHeaders(headers: HeaderCollection): string {
  // Try x-forwarded-for first (common for proxies)
  const forwarded = getHeaderValue(headers, 'x-forwarded-for');
  if (forwarded) {
    const first = (forwarded.split(',')[0] || '').trim();
    if (first && validator.isIP(first)) {
      return first;
    }
  }

  // Try common real-ip headers
  const ipHeaders = ['x-real-ip', 'cf-connecting-ip', 'true-client-ip'];
  for (const headerName of ipHeaders) {
    const val = getHeaderValue(headers, headerName);
    if (val && validator.isIP(val.trim())) {
      return val.trim();
    }
  }

  return 'unknown';
}
