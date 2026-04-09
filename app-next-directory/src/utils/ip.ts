import isIP from 'validator/lib/isIP.js';

type HeaderGetter = (name: string) => string | null | undefined;
type HeaderValue = string | string[] | undefined;
type HeaderCollection =
  | Headers
  | Map<string, string>
  | (Record<string, HeaderValue> & { get?: HeaderGetter });

const getHeaderValue = (headers: HeaderCollection | undefined, name: string): string | undefined => {
  if (!headers) return undefined;

  const lower = name.toLowerCase();
  const getter = (headers as { get?: HeaderGetter }).get;
  if (typeof getter === 'function') {
    const viaGetter = getter.call(headers, name) ?? getter.call(headers, lower);
    if (typeof viaGetter === 'string') {
      return viaGetter;
    }
  }

  const record = headers as Record<string, HeaderValue>;
  const direct = record[name] ?? record[lower];
  if (typeof direct === 'string') {
    return direct;
  }
  if (Array.isArray(direct)) {
    const first = direct.find((entry): entry is string => typeof entry === 'string');
    if (first) {
      return first;
    }
  }

  return undefined;
};

/**
 * Extracts the client IP address from the request.
 *
 * Prioritizes request.ip (if available) before checking common headers:
 * - x-forwarded-for
 * - x-real-ip
 * - cf-connecting-ip
 *
 * @param req - The incoming request
 * @returns The validated client IP address or 'unknown'
 */
export function getClientIp(req: { headers?: HeaderCollection; ip?: string }): string {
  // Try request.ip first
  if (req.ip && isIP(req.ip)) {
    return req.ip;
  }

  const headers = req.headers;
  if (!headers) {
    return 'unknown';
  }

  // x-forwarded-for: check first valid IP in the list
  const forwarded = getHeaderValue(headers, 'x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed && isIP(trimmed)) {
        return trimmed;
      }
    }
  }

  // x-real-ip
  const realIp = getHeaderValue(headers, 'x-real-ip')?.trim();
  if (realIp && isIP(realIp)) {
    return realIp;
  }

  // cf-connecting-ip (Cloudflare)
  const cfIp = getHeaderValue(headers, 'cf-connecting-ip')?.trim();
  if (cfIp && isIP(cfIp)) {
    return cfIp;
  }

  return 'unknown';
}
