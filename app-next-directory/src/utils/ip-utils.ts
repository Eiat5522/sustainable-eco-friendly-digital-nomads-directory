import validator from 'validator';

/**
 * Validates if a string is a valid IP address.
 */
export function isValidIP(ip: string): boolean {
  return validator.isIP(ip);
}

/**
 * Robustly gets a header value from various header collection types.
 */
export function getHeaderValue(
  headers: Headers | Map<string, string | string[]> | Record<string, string | string[] | undefined>,
  key: string,
  joinArray = true
): string | null {
  let value: string | string[] | null | undefined;

  if (headers instanceof Headers) {
    value = headers.get(key);
  } else if (headers instanceof Map) {
    value = headers.get(key);
  } else {
    value = headers[key];
  }

  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return joinArray ? value.join(', ') : (value[0] || null);
  }

  return value;
}

/**
 * Securely extracts the client IP from request headers.
 */
export function getClientIPFromHeaders(
  headers: Headers | Map<string, string | string[]> | Record<string, string | string[] | undefined>
): string {
  // Ordered by priority
  const ipHeaders = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

  for (const headerName of ipHeaders) {
    const value = getHeaderValue(headers, headerName);
    if (value) {
      const parts = value.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed && isValidIP(trimmed)) {
          return trimmed;
        }
      }
    }
  }

  return 'unknown';
}
