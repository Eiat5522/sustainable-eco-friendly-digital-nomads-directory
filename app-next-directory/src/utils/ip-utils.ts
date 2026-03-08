import isIP from 'validator/lib/isIP.js';

export const IP_HEADERS = ['x-forwarded-for', 'x-real-ip', 'cf-connecting-ip'];

/**
 * Interface for object that can provide header values
 */
export interface HeaderGetter {
  get(name: string): string | null | undefined;
}

/**
 * Extracts a validated client IP address from request headers.
 *
 * @param headers - An object implementing a .get(name) method (like standard Headers or a custom logger collection)
 * @returns The first valid IP address found, or null if none are found.
 */
export function extractClientIP(headers: HeaderGetter): string | null {
  for (const headerName of IP_HEADERS) {
    const value = headers.get(headerName);
    if (!value) continue;

    // For x-forwarded-for, take the first candidate in the comma-separated list
    const candidate =
      headerName === 'x-forwarded-for' ? (value.split(',')[0] || '').trim() : value.trim();

    if (candidate && isIP(candidate)) {
      return candidate;
    }
  }

  return null;
}
