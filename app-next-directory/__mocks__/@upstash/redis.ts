/**
 * Comprehensive Mock for @upstash/redis
 *
 * Following Jest Best Practices:
 * - Module-level mocking with jest.fn() for all methods
 * - Support for success, error, and edge case scenarios
 * - Transaction support with multi/exec
 * - Proper TypeScript typing
 */

import { jest } from '@jest/globals';

// Mock Redis client with all common methods
export const mockRedisClient = {
  // Basic operations
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),

  // Numeric operations
  incr: jest.fn(),
  decr: jest.fn(),
  incrby: jest.fn(),
  decrby: jest.fn(),

  // TTL/Expiration operations
  expire: jest.fn(),
  expireat: jest.fn(),
  ttl: jest.fn(),
  pttl: jest.fn(),
  persist: jest.fn(),

  // String operations
  append: jest.fn(),
  getrange: jest.fn(),
  setrange: jest.fn(),
  strlen: jest.fn(),

  // List operations
  lpush: jest.fn(),
  rpush: jest.fn(),
  lpop: jest.fn(),
  rpop: jest.fn(),
  lrange: jest.fn(),
  llen: jest.fn(),

  // Set operations
  sadd: jest.fn(),
  srem: jest.fn(),
  smembers: jest.fn(),
  sismember: jest.fn(),
  scard: jest.fn(),

  // Hash operations
  hset: jest.fn(),
  hget: jest.fn(),
  hgetall: jest.fn(),
  hdel: jest.fn(),
  hexists: jest.fn(),
  hkeys: jest.fn(),
  hvals: jest.fn(),
  hlen: jest.fn(),

  // Sorted set operations
  zadd: jest.fn(),
  zrem: jest.fn(),
  zrange: jest.fn(),
  zcard: jest.fn(),
  zscore: jest.fn(),

  // Transaction support
  multi: jest.fn().mockReturnValue({
    set: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    incr: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }),

  // Pipeline support (similar to multi but without atomicity)
  pipeline: jest.fn().mockReturnValue({
    set: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    incr: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }),

  // Key management
  keys: jest.fn(),
  scan: jest.fn(),

  // Pub/Sub
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),

  // Lua scripting
  eval: jest.fn(),
  evalsha: jest.fn(),
  evalSha: jest.fn(), // Some clients use camelCase
  script: jest.fn().mockReturnValue({
    load: jest.fn(),
    exists: jest.fn(),
    flush: jest.fn(),
  }),

  // Connection/Info
  ping: jest.fn(),
  echo: jest.fn(),
  flushall: jest.fn(),
  flushdb: jest.fn(),
  dbsize: jest.fn(),
  info: jest.fn(),

  // Upstash-specific
  json: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
};

// Mock Redis class - returns the mock client instance
export function Redis(config?: any) {
  return mockRedisClient;
}

// Mock createClient function (for node-redis compatibility)
export const createClient = jest.fn().mockImplementation(() => mockRedisClient);

// Default export for CommonJS compatibility
export default {
  Redis,
  createClient,
  mockRedisClient,
};
