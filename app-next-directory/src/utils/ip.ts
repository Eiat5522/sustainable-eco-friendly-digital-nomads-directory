import validator from 'validator';

export interface RequestLike {
  headers?:
    | Headers
    | { get: (name: string) => string | null | undefined }
    | Record<string, string | string[] | undefined>;
  ip?: string;
}

/**
 * Extracts the client IP address from the request and validates it.
 *
 * Supports standard 'x-forwarded-for', 'x-real-ip', and 'cf-connecting-ip' headers.
 * All extracted values are validated using validator.isIP to prevent spoofing hotspots.
 *
 * @param request - The incoming HTTP request or a request-like object
 * @returns The validated client IP address, or 'unknown'
 */
export function getClientIp(request: RequestLike): string {
  try {
    // 1. Try Next.js specific ip property
    if (request.ip && typeof request.ip === 'string') {
      const trimmedIp = request.ip.trim();
      if (validator.isIP(trimmedIp)) {
        return trimmedIp;
      }
    }

    // 2. Try various headers for IP address
    const getHeader = (name: string): string | null | undefined => {
      const headers = request.headers;
      if (!headers) return undefined;

      // Handle Headers object or object with get method
      if ('get' in headers && typeof headers.get === 'function') {
        return headers.get(name);
      }

      // Handle plain object
      const val = (headers as Record<string, string | string[] | undefined>)[name];
      if (Array.isArray(val)) return val[0];
      return val as string | undefined;
    };

    const xForwardedFor = getHeader('x-forwarded-for');
    if (xForwardedFor) {
      const first = (xForwardedFor.split(',')[0] || '').trim();
      if (first && validator.isIP(first)) {
        return first;
      }
    }

    const xRealIp = getHeader('x-real-ip');
    if (xRealIp) {
      const trimmed = xRealIp.trim();
      if (trimmed && validator.isIP(trimmed)) {
        return trimmed;
      }
    }

    const cfConnectingIp = getHeader('cf-connecting-ip');
    if (cfConnectingIp) {
      const trimmed = cfConnectingIp.trim();
      if (trimmed && validator.isIP(trimmed)) {
        return trimmed;
      }
    }
  } catch {
    // Fallback on unexpected errors
  }

  return 'unknown';
}
