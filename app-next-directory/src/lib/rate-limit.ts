// Simple in-memory rate limiter for Node runtime.
// Not suitable for multi-instance deployments; use a shared store (Redis) in production.

type Key = string;
type Bucket = { count: number; resetAt: number };

const store: Map<Key, Bucket> = new Map();

export function getClientIp(req: Request): string {
  try {
    const xf = req.headers.get('x-forwarded-for');
    if (xf) return xf.split(',')[0].trim();
    const xr = req.headers.get('x-real-ip');
    if (xr) return xr;
  } catch {}
  return 'unknown';
}

export function isRateLimited(key: string, limit = 10, windowSec = 60): boolean {
  if (!Number.isFinite(limit) || !Number.isFinite(windowSec)) return true;
  if (limit <= 0) return true;
  const windowMs = Math.max(1, Math.floor(windowSec * 1000));
  const now = Date.now();
  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (bucket.count >= limit) return true;
  bucket.count += 1;
  return false;
}

export function getRetryAfterMs(key: string): number {
  const b = store.get(key);
  const now = Date.now();
  return b ? Math.max(0, b.resetAt - now) : 0;
}

