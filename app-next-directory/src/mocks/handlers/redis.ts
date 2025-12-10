/**
 * MSW Handlers for Redis/Upstash REST API
 *
 * Intercepts HTTP requests to Upstash Redis REST API:
 * - GET/POST https://*.upstash.io/* - Redis commands via HTTP
 *
 * Upstash Redis uses HTTP REST API with commands like:
 * - GET /get/{key}
 * - POST /set/{key}
 * - POST /incr/{key}
 * - POST /del/{key}
 *
 * @module mocks/handlers/redis
 */

import { HttpResponse, http } from 'msw';

// In-memory Redis store for tests
const redisStore = new Map<string, string | number>();
const expirations = new Map<string, number>();

// Helper to check if key is expired
const isExpired = (key: string): boolean => {
  const expireAt = expirations.get(key);
  if (expireAt && Date.now() > expireAt) {
    redisStore.delete(key);
    expirations.delete(key);
    return true;
  }
  return false;
};

/**
 * Redis/Upstash API handlers
 */
export const redisHandlers = [
  /**
   * GET - Redis GET command
   * Pattern: /get/{key}
   */
  http.get('https://:endpoint.upstash.io/get/:key', ({ params }) => {
    const { key } = params as { key: string };

    if (isExpired(key) || !redisStore.has(key)) {
      return HttpResponse.json({ result: null });
    }

    return HttpResponse.json({ result: redisStore.get(key) });
  }),

  /**
   * POST - Redis SET command
   * Pattern: /set/{key}
   * Body: { value: string | number, ex?: number }
   */
  http.post('https://:endpoint.upstash.io/set/:key', async ({ request, params }) => {
    const { key } = params as { key: string };
    let body: { value?: string | number; ex?: number } = {};

    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // If no body or invalid JSON, use empty object
    }

    const value = body.value ?? '';
    redisStore.set(key, value);

    // Handle expiration (EX option in seconds)
    if (body.ex) {
      expirations.set(key, Date.now() + body.ex * 1000);
    }

    return HttpResponse.json({ result: 'OK' });
  }),

  /**
   * POST - Redis INCR command
   * Pattern: /incr/{key}
   */
  http.post('https://:endpoint.upstash.io/incr/:key', ({ params }) => {
    const { key } = params as { key: string };

    const current = redisStore.get(key);
    const currentNum = typeof current === 'number' ? current : Number(current) || 0;
    const newValue = currentNum + 1;
    redisStore.set(key, newValue);

    return HttpResponse.json({ result: newValue });
  }),

  /**
   * POST - Redis DEL command
   * Pattern: /del/{key}
   */
  http.post('https://:endpoint.upstash.io/del/:key', ({ params }) => {
    const { key } = params as { key: string };

    const existed = redisStore.has(key);
    redisStore.delete(key);
    expirations.delete(key);

    return HttpResponse.json({ result: existed ? 1 : 0 });
  }),

  /**
   * POST - Redis EXPIRE command
   * Pattern: /expire/{key}
   * Body: { seconds: number }
   */
  http.post('https://:endpoint.upstash.io/expire/:key', async ({ request, params }) => {
    const { key } = params as { key: string };
    let body: { seconds?: number } = {};

    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // If no body or invalid JSON, use empty object
    }

    if (!redisStore.has(key)) {
      return HttpResponse.json({ result: 0 });
    }

    if (body.seconds) {
      expirations.set(key, Date.now() + body.seconds * 1000);
    }

    return HttpResponse.json({ result: 1 });
  }),

  /**
   * GET - Redis PING command
   * Pattern: /ping
   */
  http.get('https://:endpoint.upstash.io/ping', () => {
    return HttpResponse.json({ result: 'PONG' });
  }),

  /**
   * POST - Redis PING command
   * Pattern: /ping
   */
  http.post('https://:endpoint.upstash.io/ping', () => {
    return HttpResponse.json({ result: 'PONG' });
  }),

  /**
   * Wildcard handler for other Redis commands
   * Upstash uses /{command}/{...args} pattern
   */
  http.post('https://:endpoint.upstash.io/*', () => {
    // For unhandled commands, return a generic success response
    return HttpResponse.json({ result: 'OK' });
  }),

  http.get('https://:endpoint.upstash.io/*', () => {
    // For unhandled GET commands, return null
    return HttpResponse.json({ result: null });
  }),
];

/**
 * Helper to reset the in-memory Redis store between tests
 */
export const resetRedisStore = () => {
  redisStore.clear();
  expirations.clear();
};

/**
 * Helper to seed the Redis store with test data
 */
export const seedRedisStore = (data: Record<string, string | number>) => {
  Object.entries(data).forEach(([key, value]) => {
    redisStore.set(key, value);
  });
};

/**
 * Helper to get the current Redis store state (for testing)
 */
export const getRedisStoreState = () => {
  return new Map(redisStore);
};

export default redisHandlers;
