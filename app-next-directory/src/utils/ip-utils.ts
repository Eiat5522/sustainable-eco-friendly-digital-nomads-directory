import validator from 'validator';

/**
 * Configuration options for IP extraction
 */
export interface IPUtilsOptions {
  /**
   * Whether to fallback to 'unknown' if no IP is found.
   * If false, returns undefined.
   */
  fallbackToUnknown?: boolean;
  /**
   * Whether to return the full x-forwarded-for string if present.
   * Useful for logging.
   */
  returnAllForwarded?: boolean;
}

/**
 * Extracts the client IP address from request headers.
 *
 * Checks common headers in priority order:
 * 1. x-forwarded-for
 * 2. x-real-ip
 * 3. cf-connecting-ip
 *
 * Employs validator.isIP to ensure extracted values are valid.
 */
export function getClientIPFromHeaders(
  headers: Headers | Record<string, string | string[] | undefined> | null | undefined,
  options: IPUtilsOptions = { fallbackToUnknown: true, returnAllForwarded: false }
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

  const realIP = getHeader('x-real-ip');
  if (realIP && validator.isIP(realIP.trim())) {
    return realIP.trim();
  }

  const cfConnectingIP = getHeader('cf-connecting-ip');
  if (cfConnectingIP && validator.isIP(cfConnectingIP.trim())) {
    return cfConnectingIP.trim();
  }

  return options.fallbackToUnknown ? 'unknown' : undefined;
}

/**
 * Extracts the client IP address from a Request object.
 */
export function getClientIp(req: Request, options?: IPUtilsOptions): string {
  return getClientIPFromHeaders(req.headers, options) ?? 'unknown';
}
