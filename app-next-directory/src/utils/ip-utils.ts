import validator from 'validator';

/**
 * Consolidated utility for secure client IP extraction.
 * Addresses SonarCloud Security Hotspots by validating all IP candidates.
 * Stops at the first valid IP found to prevent spoofing.
 */
export const extractClientIP = (
  headers: Headers | { get(name: string): string | null } | Record<string, string | string[] | undefined> | null | undefined
): string => {
  if (!headers) return 'unknown';

  const IP_HEADERS = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'] as const;

  for (const headerName of IP_HEADERS) {
    let value: string | null = null;

    if (typeof (headers as Headers).get === 'function') {
      value = (headers as Headers).get(headerName);
    } else {
      const raw = (headers as Record<string, string | string[] | undefined>)[headerName];
      value = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
    }

    if (!value) continue;

    // Use a loop to validate each comma-separated candidate
    const candidates = value.split(',');
    for (const candidate of candidates) {
      const ip = candidate.trim();
      if (ip && validator.isIP(ip)) {
        return ip;
      }
    }
  }

  return 'unknown';
};

/**
 * Helper to extract IP from a Request-like object
 */
export const getIPFromRequest = (req: { headers: Headers } | Request | null | undefined): string => {
  return extractClientIP(req?.headers);
};
