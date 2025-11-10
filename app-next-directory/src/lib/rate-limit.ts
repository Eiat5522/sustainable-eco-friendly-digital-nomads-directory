// Simple in-memory rate limiter for Node runtime.
// Not suitable for multi-instance deployments; use a shared store (Redis) in production.

type Key = string;
type Bucket = { count: number; resetAt: number };

const MAX_BUCKETS = 10_000;

function sweepExpiredBuckets(now: number) {
  for (const [k, b] of store) {
    if (b.resetAt <= now) store.delete(k);
  }
}

function enforceCapacity() {
  if (store.size <= MAX_BUCKETS) return;
  // Sort by resetAt and evict expired or oldest buckets first
  const sorted = Array.from(store.entries()).sort((a, b) => a[1].resetAt - b[1].resetAt);
  const toDelete = sorted.slice(0, store.size - MAX_BUCKETS);
  for (const [k] of toDelete) {
    store.delete(k);
  }
}
const store: Map<Key, Bucket> = new Map();

export let getClientIp = (req: Request): string => {
  try {
    const xf = req.headers.get('x-forwarded-for');
    if (xf) return xf.split(',')[0].trim();
    const xr = req.headers.get('x-real-ip');
    if (xr) return xr;
  } catch {}
  return 'unknown';
};

let lastCleanup = 0;
const CLEANUP_INTERVAL_MS = 60_000; // Run cleanup every minute

function performCleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  sweepExpiredBuckets(now);
  enforceCapacity();
  lastCleanup = now;
}

export let isRateLimited = (key: string, limit = 10, windowSec = 60): boolean => {
  if (!Number.isFinite(limit) || !Number.isFinite(windowSec)) return true;
  if (limit <= 0) return true;
  const windowMs = Math.max(1, Math.floor(windowSec * 1000));
  const now = Date.now();
  performCleanup(now);

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (bucket.count >= limit) return true;
  bucket.count += 1;
  return false;
};

export let getRetryAfterMs = (key: string): number => {
  const b = store.get(key);
  const now = Date.now();
  return b ? Math.max(0, b.resetAt - now) : 0;
};

// When running under Jest, some test files import this module before
// test setup code runs. To make the exported helpers safely mockable we
// wrap them with jest.fn when available so tests can call
// .mockReturnValue/.mockResolvedValue and use Jest matchers like
// toHaveBeenCalledWith. This preserves the original implementation for
// non-test runtimes.
if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
  type JestLike = {
    fn: <T extends (...args: never[]) => unknown>(implementation: T) => T & {
      mockImplementation?: (...args: Parameters<T>) => ReturnType<T>;
    };
  };

  const maybeJest = (globalThis as { jest?: JestLike }).jest;

  if (maybeJest) {
    const originalGetClientIp = getClientIp;
    const originalIsRateLimited = isRateLimited;
    const originalGetRetryAfterMs = getRetryAfterMs;

    getClientIp = maybeJest.fn(originalGetClientIp) as typeof getClientIp;
    isRateLimited = maybeJest.fn(originalIsRateLimited) as typeof isRateLimited;
    getRetryAfterMs = maybeJest.fn(originalGetRetryAfterMs) as typeof getRetryAfterMs;
  } else {
    console.warn('Jest not available for mocking in rate-limit module');
  }
}
