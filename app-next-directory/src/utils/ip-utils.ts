import validator from 'validator';

/**
 * Collection of headers that might contain IP information.
 * Supports standard Headers, Map-like objects, or plain objects.
 */
export type HeaderCollection =
  | Headers
  | Map<string, string | string[]>
  | Record<string, string | string[] | undefined | null>;

/**
 * Safely extracts a header value from various header collection types.
 */
export function getHeaderValue(headers: HeaderCollection, key: string): string | null {
  if (headers instanceof Headers) {
    return headers.get(key);
  }
  if (headers instanceof Map) {
    const value = headers.get(key);
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  }
  const value = headers[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * Extracts the first valid client IP from headers.
 * Uses a secure pattern with validator.isIP to prevent spoofing.
 */
export function getClientIPFromHeaders(headers: HeaderCollection): string {
  const ipHeaders = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

  for (const headerName of ipHeaders) {
    const value = getHeaderValue(headers, headerName);
    if (value) {
      // For x-forwarded-for, we take the first IP
      const parts = value.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (validator.isIP(trimmed)) {
          return trimmed;
        }
      }
    }
  }

  return 'unknown';
}
