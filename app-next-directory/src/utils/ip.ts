import validator from 'validator';

/**
 * Extracts the client IP address from the request headers.
 *
 * Checks multiple common headers used by proxies and load balancers:
 * - x-forwarded-for
 * - x-real-ip
 * - cf-connecting-ip (Cloudflare)
 *
 * Each candidate IP is validated using validator.isIP.
 *
 * @param request - The incoming HTTP request
 * @returns The client IP address, or 'unknown' if none found or all were invalid
 */
export function getClientIP(request: Request): string {
  const ipHeaders = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

  for (const header of ipHeaders) {
    const value = request.headers.get(header);
    if (!value) continue;

    // x-forwarded-for can be a comma-separated list
    const candidates = value.split(',').map(s => s.trim());

    for (const candidate of candidates) {
      if (candidate && validator.isIP(candidate)) {
        return candidate;
      }
    }
  }

  return 'unknown';
}
