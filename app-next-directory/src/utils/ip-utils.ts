import validator from 'validator';

/**
 * Extracts and validates the client IP address from the request headers.
 *
 * Checks multiple common headers used by proxies and load balancers:
 * - x-forwarded-for (finds the first valid IP in the list)
 * - x-real-ip
 * - cf-connecting-ip (Cloudflare)
 *
 * @param headers - The incoming HTTP request headers (Headers object or Record)
 * @returns The first valid client IP address found, or 'unknown' if none found or all are invalid
 */
export function getClientIPFromHeaders(headers: Headers | { get(name: string): string | null } | Record<string, string | string[] | undefined>): string {
  const ipHeaders = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

  for (const header of ipHeaders) {
    let value: string | null = null;

    if (typeof (headers as Headers).get === 'function') {
      value = (headers as Headers).get(header);
    } else {
      const val = (headers as Record<string, string | string[] | undefined>)[header];
      if (Array.isArray(val)) {
        value = val[0] ?? null;
      } else {
        value = val ?? null;
      }
    }

    if (value) {
      if (header === 'x-forwarded-for') {
        const parts = value.split(',');
        for (const part of parts) {
          const candidate = part.trim();
          if (candidate && validator.isIP(candidate)) {
            return candidate;
          }
        }
      } else {
        const candidate = value.trim();
        if (candidate && validator.isIP(candidate)) {
          return candidate;
        }
      }
    }
  }

  return 'unknown';
}
