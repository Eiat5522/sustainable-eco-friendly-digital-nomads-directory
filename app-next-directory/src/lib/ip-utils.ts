import validator from 'validator';

/**
 * Extracts the client IP address from the request headers.
 *
 * Checks multiple common headers used by proxies and load balancers:
 * - x-forwarded-for (first IP in the list)
 * - x-real-ip
 * - cf-connecting-ip (Cloudflare)
 *
 * Supports both IPv4 and IPv6 addresses and strips ports if present.
 *
 * @param request - The incoming HTTP request
 * @returns The client IP address, or 'unknown' if none found or if invalid
 */
export function getClientIp(request: Request): string {
  try {
    // Try various headers for IP address
    const headers = [
      request.headers.get('x-forwarded-for')?.split(',')[0],
      request.headers.get('x-real-ip'),
      request.headers.get('cf-connecting-ip'),
    ];

    for (const rawValue of headers) {
      if (!rawValue) continue;

      let ip = rawValue.trim();

      // Handle IPv6 with port (e.g. [2001:db8::1]:8080)
      if (ip.startsWith('[') && ip.includes(']')) {
        ip = ip.split(']')[0].replace('[', '');
      } else if (ip.split(':').length === 2) {
        // Handle IPv4 with port (e.g. 127.0.0.1:8080)
        ip = ip.split(':')[0];
      }

      if (ip && validator.isIP(ip)) {
        return ip;
      }
    }
  } catch (_error) {
    // Silently fail and return 'unknown'
  }

  // Fallback to a default if no valid IP found
  return 'unknown';
}
