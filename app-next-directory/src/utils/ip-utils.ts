import validator from 'validator';

/**
 * Extracts the client IP address from the request headers.
 *
 * Checks multiple common headers used by proxies and load balancers:
 * - x-forwarded-for (first valid IP in the list)
 * - x-real-ip
 * - cf-connecting-ip (Cloudflare)
 *
 * @param headers - The incoming HTTP request headers
 * @returns The client IP address, or 'unknown' if none found
 */
export function extractClientIP(
  headers: Headers | { get: (name: string) => string | null | undefined }
): string {
  const ipHeaders = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

  for (const header of ipHeaders) {
    try {
      const value = headers.get(header);
      if (!value) continue;

      const ips = header === 'x-forwarded-for' ? value.split(',') : [value];

      for (const ip of ips) {
        const trimmedIp = ip.trim();
        if (validator.isIP(trimmedIp)) {
          return trimmedIp;
        }
      }
    } catch {
      // Ignore header access errors
    }
  }

  return 'unknown';
}
