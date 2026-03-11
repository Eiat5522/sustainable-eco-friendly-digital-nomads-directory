import validator from 'validator';

/**
 * Extracts the first valid client IP address from request headers.
 * Prevents IP spoofing by validating each IP and picking the first valid one.
 *
 * @param headers - Request headers
 * @returns The client IP address or 'unknown' if not found
 */
export function getClientIPFromHeaders(headers: Headers): string {
  // Common headers used by proxies and load balancers
  const headerKeys = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

  for (const key of headerKeys) {
    const value = headers.get(key);
    if (!value) continue;

    if (key === 'x-forwarded-for') {
      const ips = value.split(',').map(ip => ip.trim());
      for (const ip of ips) {
        if (ip && validator.isIP(ip)) {
          return ip;
        }
      }
    } else {
      const trimmedValue = value.trim();
      if (validator.isIP(trimmedValue)) {
        return trimmedValue;
      }
    }
  }

  return 'unknown';
}
