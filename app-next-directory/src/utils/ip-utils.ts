import isIP from 'validator/lib/isIP.js';

export const IP_HEADERS = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

/**
 * Interface for object that can provide header values
 */
export interface HeaderGetter {
  get(name: string): string | null | undefined;
}

/**
 * Extracts a validated client IP address from request headers or an optional candidate.
 *
 * @param headers - An object implementing a .get(name) method (like standard Headers or a custom logger collection)
 * @param candidate - An optional IP string to validate and return if valid
 * @returns The first valid IP address found, or null if none are found.
 */
export function extractClientIP(headers: HeaderGetter, candidate?: string | null): string | null {
  if (candidate && isIP(candidate)) {
    return candidate;
  }

  for (const headerName of IP_HEADERS) {
    const value = headers.get(headerName);
    if (!value) continue;

    // For x-forwarded-for, take the first candidate in the comma-separated list
    const ipCandidate =
      headerName === 'x-forwarded-for' ? (value.split(',')[0] || '').trim() : value.trim();

    if (ipCandidate && isIP(ipCandidate)) {
      return ipCandidate;
    }
  }

  return null;
}
