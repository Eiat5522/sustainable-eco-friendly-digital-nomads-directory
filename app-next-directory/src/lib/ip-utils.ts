import validator from 'validator';

/**
 * Validates an IP address string and removes port information if present.
 * Supports both IPv4 and IPv6.
 *
 * @param ip - The IP address string to validate and cleanup
 * @returns The cleaned IP address if valid, otherwise null
 */
function validateAndCleanupIp(ip: string): string | null {
  if (!ip) return null;

  let cleanedIp = ip.trim();

  // Handle IPv6 with port (e.g. [2001:db8::1]:8080)
  if (cleanedIp.startsWith('[') && cleanedIp.includes(']')) {
    cleanedIp = cleanedIp.split(']')[0].replace('[', '');
  } else {
    // Handle IPv4 with port (e.g. 127.0.0.1:8080)
    // We check if there's exactly one colon to avoid misidentifying IPv6
    const parts = cleanedIp.split(':');
    if (parts.length === 2) {
      cleanedIp = parts[0];
    }
  }

  if (cleanedIp && validator.isIP(cleanedIp)) {
    return cleanedIp;
  }

  return null;
}

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
 * @param req - The incoming HTTP request or an object with headers
 * @returns The client IP address, or 'unknown' if none found or if invalid
 */
export function getClientIp(req: any): string {
  if (!req || !req.headers) {
    return 'unknown';
  }

  const headers = req.headers;

  // Helper to get header value regardless of header object type (Headers or plain object)
  const getHeader = (name: string): string | null => {
    if (typeof headers.get === 'function') {
      return headers.get(name);
    }
    const val = headers[name] || headers[name.toLowerCase()];
    if (Array.isArray(val)) return val[0] || null;
    return val || null;
  };

  // Try x-forwarded-for first (common for proxies)
  const xff = getHeader('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0];
    const validated = validateAndCleanupIp(first);
    if (validated) return validated;
  }

  // Try x-real-ip (common for Nginx/Load Balancers)
  const xri = getHeader('x-real-ip');
  if (xri) {
    const validated = validateAndCleanupIp(xri);
    if (validated) return validated;
  }

  // Try cf-connecting-ip (Cloudflare)
  const cf = getHeader('cf-connecting-ip');
  if (cf) {
    const validated = validateAndCleanupIp(cf);
    if (validated) return validated;
  }

  // Fallback to a default if no valid IP found
  return 'unknown';
}
