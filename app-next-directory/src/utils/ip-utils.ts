import validator from 'validator';

export type HeaderCollection = Headers | Map<string, string | string[]> | Record<string, string | string[] | undefined>;

/**
 * Get a header value from various types of header collections
 */
export function getHeaderValue(headers: HeaderCollection, name: string): string | null {
  if (headers instanceof Headers) {
    return headers.get(name);
  }

  if (headers instanceof Map) {
    const value = headers.get(name);
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value || null;
  }

  const value = headers[name];
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value || null;
}

/**
 * Extracts and validates the client IP address from request headers.
 * Prevents IP spoofing hotspots by validating the IP using validator.isIP.
 */
export function getClientIPFromHeaders(headers: HeaderCollection): string {
  // Try various headers for IP address
  const xForwardedFor = getHeaderValue(headers, 'x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = (xForwardedFor.split(',')[0] || '').trim();
    if (validator.isIP(firstIp)) {
      return firstIp;
    }
  }

  const xRealIP = getHeaderValue(headers, 'x-real-ip');
  if (xRealIP && validator.isIP(xRealIP.trim())) {
    return xRealIP.trim();
  }

  const cfConnectingIP = getHeaderValue(headers, 'cf-connecting-ip');
  if (cfConnectingIP && validator.isIP(cfConnectingIP.trim())) {
    return cfConnectingIP.trim();
  }

  // Fallback to a default if no valid IP found
  return 'unknown';
}
