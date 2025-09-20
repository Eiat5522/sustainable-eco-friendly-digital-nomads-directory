export function decodeCallbackUrl(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    let decoded = raw;
    let previous: string | undefined;
    let iterations = 0;
    const MAX_ITERATIONS = 10; // Reasonable limit for nested encoding
    // Decode repeatedly until the value stabilises to avoid double-encoding issues.
    do {
      previous = decoded;
      decoded = decodeURIComponent(decoded);
      iterations++;
    } while (decoded !== previous && /%[0-9A-Fa-f]{2}/.test(decoded) && iterations < MAX_ITERATIONS);
    return decoded;
  } catch {
    return null;
  }
}

export function sanitizeCallbackUrl(
  raw: string | null | undefined,
  baseOrigin?: string
): string | null {
  const decoded = decodeCallbackUrl(raw);
  if (!decoded) return null;
  if (/\s/.test(decoded)) return null;

  if (decoded.startsWith('/')) {
    // Block protocol-relative URLs (e.g. //evil.com)
    return decoded.startsWith('//') ? null : decoded;
  }

  if (!baseOrigin) return null;

  try {
    const url = new URL(decoded, baseOrigin);
    if (url.origin !== baseOrigin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
