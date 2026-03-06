import validator from 'validator';

/**
 * Robustly extracts and validates a client IP address from request metadata.
 *
 * Checks common proxy/load-balancer headers in priority order:
 * 1. x-forwarded-for (first valid IP in the list)
 * 2. x-real-ip
 * 3. cf-connecting-ip (Cloudflare)
 *
 * This implementation addresses SonarCloud security hotspots by:
 * - Using a loop to avoid code duplication
 * - Validating every candidate IP with validator.isIP before returning
 *
 * @param input - A Request object, a Headers object, or a plain record of strings
 * @returns The first valid client IP address found, or 'unknown' if none are valid
 */
export function getClientIP(input: Request | Headers | Record<string, string | null | undefined>): string {
  const ipHeaders = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

  const getHeader = (name: string): string | null | undefined => {
    if (input instanceof Request) return input.headers.get(name);
    if (input instanceof Headers) return input.get(name);
    return input[name];
  };

  for (const header of ipHeaders) {
    const value = getHeader(header);
    if (!value) continue;

    // x-forwarded-for can be a comma-separated list
    const candidates = value.split(',').map(s => s.trim());

    for (const candidate of candidates) {
      // validator.isIP ensures the string is a legitimate IPv4 or IPv6 address
      if (candidate && validator.isIP(candidate)) {
        return candidate;
      }
    }
  }

  return 'unknown';
}
