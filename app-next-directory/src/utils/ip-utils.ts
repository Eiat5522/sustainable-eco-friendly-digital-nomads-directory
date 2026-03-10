import validator from 'validator';

/**
 * Extracts the client IP address from the request headers.
 *
 * Checks multiple common headers used by proxies and load balancers:
 * - x-forwarded-for (first IP in the list)
 * - x-real-ip
 * - cf-connecting-ip (Cloudflare)
 *
 * Employs validator.isIP to prevent IP spoofing and ensuring the extracted value
 * is a valid IP address.
 *
 * @param headers - The headers object from the request
 * @param options - Configuration options
 * @returns The client IP address, or 'unknown' if none found or invalid
 */
export function getClientIPFromHeaders(
  headers: Headers | Record<string, string | string[] | undefined> | null | undefined,
  options: { fallbackToUnknown?: boolean; returnAllForwarded?: boolean } = {
    fallbackToUnknown: true,
    returnAllForwarded: false,
  }
): string | undefined {
  if (!headers) return options.fallbackToUnknown ? 'unknown' : undefined;

  const getHeader = (name: string): string | null | undefined => {
    if (typeof (headers as Headers).get === 'function') {
      return (headers as Headers).get(name);
    }
    const record = headers as Record<string, string | string[] | undefined>;
    const value = record[name] ?? record[name.toLowerCase()];
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const forwarded = getHeader('x-forwarded-for');
  if (forwarded) {
    if (options.returnAllForwarded) {
      return forwarded;
    }
    const ips = forwarded.split(',');
    for (const ip of ips) {
      const trimmedIp = ip.trim();
      if (validator.isIP(trimmedIp)) {
        return trimmedIp;
      }
    }
  }

  const realIP = headers.get('x-real-ip');
  if (realIP && validator.isIP(realIP.trim())) {
    return realIP.trim();
  }

  const cfConnectingIP = getHeader('cf-connecting-ip');
  if (cfConnectingIP && validator.isIP(cfConnectingIP.trim())) {
    return cfConnectingIP.trim();
  }

  return options.fallbackToUnknown ? 'unknown' : undefined;
}
