import validator from 'validator';

/**
 * Collection of headers from Next.js (can be Headers, Map, or Record)
 */
export type HeaderCollection =
  | Headers
  | Map<string, string | string[] | null | undefined>
  | Record<string, string | string[] | null | undefined>;

/**
 * Internal helper to extract values from diverse header collections
 */
function getRawHeaderValue(headers: HeaderCollection, name: string): string | string[] | null {
  if (headers instanceof Headers) {
    return headers.get(name);
  }

  // Handle objects with get method (Headers-like)
  if (typeof (headers as any).get === 'function') {
    return (headers as any).get(name) ?? null;
  }

  if (headers instanceof Map) {
    return headers.get(name) ?? null;
  }

  return (headers as Record<string, any>)[name] ?? null;
}

/**
 * Helper to get a header value regardless of the collection type.
 * By default returns the first value if it's an array.
 * If returnAll is true, returns joined string for arrays.
 */
export function getHeaderValue(
  headers: HeaderCollection | undefined,
  name: string,
  returnAll = false
): string | null {
  if (!headers) return null;

  const raw = getRawHeaderValue(headers, name);
  if (raw === null) return null;

  if (Array.isArray(raw)) {
    if (returnAll) return raw.join(', ');
    return raw[0] !== undefined ? String(raw[0]) : null;
  }
  return String(raw);
}

/**
 * Extracts the first valid IP address from request headers.
 * Implements protection against IP spoofing by validating extracted values.
 */
export function getClientIPFromHeaders(headers: HeaderCollection | undefined): string {
  if (!headers) return 'unknown';

  // Ordered by priority
  const headerNames = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'] as const;

  for (const name of headerNames) {
    // For x-forwarded-for we want the full chain to find the first entry
    const value = getHeaderValue(headers, name, name === 'x-forwarded-for');
    if (!value) continue;

    const parts = value.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed && validator.isIP(trimmed)) {
        return trimmed;
      }
      // If x-forwarded-for's first part is invalid, we move to the next header
      // instead of checking other parts of the same header to prevent spoofing
      // of the chain itself if it's malformed.
      if (name === 'x-forwarded-for') break;
    }
  }

  return 'unknown';
}
