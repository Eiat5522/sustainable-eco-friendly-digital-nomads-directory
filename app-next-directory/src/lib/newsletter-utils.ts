import { getRedisClient, mockRedisClient } from './redis';
import type { RedisLike } from './redis';
import { structuredLogger } from './logger';

// Simple in-memory fallback store with TTL support
type StoredValue = { value: string; expiresAt: number };
const memoryStore = new Map<string, StoredValue>();

async function memoryGet(key: string): Promise<string | null> {
  // Allow tests to override the behavior synchronously or asynchronously.
  const override = _testControl?.memoryGetOverride;
  if (override) {
    return await override(key);
  }

  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: string, ttlSeconds: number) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  memoryStore.set(key, { value, expiresAt });
}

// Exported test control hooks used by tests to simulate specific memory behaviors.
// Tests will assign functions to these properties to override in-memory operations.
const isTestEnv = !!process.env.JEST_WORKER_ID;

export const _testControl = isTestEnv
  ? {
      // (key) => string|null | Promise<string|null>
      memoryGetOverride: undefined as
        | ((key: string) => string | null | Promise<string | null>)
        | undefined,
      // (key, ttl) => number | Promise<number>
      memoryIncrOverride: undefined as
        | ((key: string, ttlSeconds: number) => number | Promise<number>)
        | undefined,
    }
  : undefined;

async function memoryIncr(key: string, ttlSeconds: number): Promise<number> {
  // Allow tests to override the behavior synchronously or asynchronously.
  const override = _testControl?.memoryIncrOverride;
  if (override) {
    return await override(key, ttlSeconds);
  }

  const entry = memoryStore.get(key);
  const now = Date.now();
  if (!entry || now > entry.expiresAt) {
    memorySet(key, '1', ttlSeconds);
    return 1;
  }
  const next = Number(entry.value) + 1;
  memoryStore.set(key, { value: String(next), expiresAt: entry.expiresAt }); // preserve original expiry
  return next;
}

// Add periodic cleanup for memory store
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function startMemoryCleanup() {
  if (cleanupInterval) return;
  // Periodically purge expired entries from the in-memory store
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.expiresAt) memoryStore.delete(key);
    }
  }, 60_000);
}

export function _clearMemoryStore() {
  memoryStore.clear();
}

// Upstash Redis (shared client) helpers with memory fallback
const resolveUpstashClient = (): RedisLike | undefined => {
  try {
    const client = getRedisClient();
    return client ? ((client as unknown) as RedisLike) : undefined;
  } catch (error) {
    console.warn('[newsletter] Redis unavailable, using in-memory fallback only.', error);
    return undefined;
  }
};

const upstash = resolveUpstashClient();
startMemoryCleanup();

const resolvedMockRedisClient: RedisLike | undefined = process.env.JEST_WORKER_ID
  ? mockRedisClient
  : undefined;

const shouldUseUpstashClient = Boolean(
  upstash && (!resolvedMockRedisClient || upstash !== (resolvedMockRedisClient as unknown))
);

export const upstashClient: RedisLike | undefined = shouldUseUpstashClient && upstash
  ? ((upstash as unknown) as RedisLike)
  : undefined;

export async function storeGet(key: string) {
  const client = upstashClient;
  if (client) {
    try {
      const v = await client.get<string>(key);
      return v ?? null;
    } catch {
      return memoryGet(key);
    }
  }
  return memoryGet(key);
}

export async function storeSet(key: string, value: string, ttlSeconds: number) {
  const client = upstashClient;
  if (client) {
    try {
      await client.set(key, value, { ex: ttlSeconds });
      return;
    } catch {
      memorySet(key, value, ttlSeconds);
      return;
    }
  }
  memorySet(key, value, ttlSeconds);
}

export async function storeIncr(key: string, ttlSeconds: number) {
  const client = upstashClient;
  if (client) {
    try {
      const val = await client.incr(key);
      if (val === 1) {
        // set expiry only on first creation
        await client.expire(key, ttlSeconds);
      }
      return Number(val);
    } catch {
      return memoryIncr(key, ttlSeconds);
    }
  }
  return memoryIncr(key, ttlSeconds);
}
