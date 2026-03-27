import { jest } from '@jest/globals';

const mockRedisClient = {};
const mockRatelimitLimit = jest.fn();

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(() => mockRedisClient),
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    jest.fn(() => ({
      limit: mockRatelimitLimit,
    })),
    {
      slidingWindow: jest.fn(() => ({})),
    }
  ),
}));

const loadModule = () => {
  jest.resetModules();
  return jest.requireActual<typeof import('../rate-limit')>('../rate-limit');
};

describe('rate-limit utils', () => {
  let mod: any;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.DISABLE_UPSTASH_DURING_BUILD;

    // Clear global redis client
    (globalThis as any)._redisClient = undefined;

    mod = loadModule();
    mod.rateLimitStore.clear();
    mod.clearRedisClient();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('in-memory rate limiting', () => {
    it('should allow requests within limit', async () => {
      const limiter = mod.rateLimit({ max: 2, windowMs: 1000 });
      const req = new Request('http://localhost', { headers: { 'x-forwarded-for': '1.1.1.1' } });

      const res1 = await limiter(req);
      expect(res1.success).toBe(true);
      expect(res1.remaining).toBe(1);

      const res2 = await limiter(req);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(0);

      const res3 = await limiter(req);
      expect(res3.success).toBe(false);
      expect(res3.remaining).toBe(0);
    });

    it('should reset after window expires', async () => {
      const limiter = mod.rateLimit({ max: 1, windowMs: 50 });
      const req = new Request('http://localhost', { headers: { 'x-forwarded-for': '2.2.2.2' } });

      await limiter(req);
      const res2 = await limiter(req);
      expect(res2.success).toBe(false);

      // Manually trigger cleanup by moving time forward (simulated by entry modification)
      const entry = mod.rateLimitStore.get('2.2.2.2');
      entry.resetTime = Date.now() - 1000;

      const res3 = await limiter(req);
      expect(res3.success).toBe(true);
      expect(res3.remaining).toBe(0);
    });

    it('should handle different IP headers', async () => {
      const limiter = mod.rateLimit({ max: 1, windowMs: 1000 });

      const reqReal = new Request('http://localhost', { headers: { 'x-real-ip': '3.3.3.3' } });
      const resReal = await limiter(reqReal);
      expect(resReal.success).toBe(true);

      const reqCF = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '4.4.4.4' },
      });
      const resCF = await limiter(reqCF);
      expect(resCF.success).toBe(true);

      const reqUnknown = new Request('http://localhost');
      const resUnknown = await limiter(reqUnknown);
      expect(resUnknown.success).toBe(true);
    });

    it('should handle invalid IP address', async () => {
      const limiter = mod.rateLimit({ max: 1, windowMs: 1000 });
      const req = new Request('http://localhost', { headers: { 'x-forwarded-for': 'invalid-ip' } });

      const res = await limiter(req);
      expect(res.success).toBe(true);

      // Should fall back to 'unknown' key
      expect(mod.rateLimitStore.has('unknown')).toBe(true);
      expect(mod.rateLimitStore.has('invalid-ip')).toBe(false);
    });

    it('should cleanup expired entries', async () => {
      const limiter = mod.rateLimit({ max: 1, windowMs: 1000 });
      const req = new Request('http://localhost', { headers: { 'x-forwarded-for': '5.5.5.5' } });

      await limiter(req);
      expect(mod.rateLimitStore.size).toBe(1);

      const entry = mod.rateLimitStore.get('5.5.5.5');
      entry.resetTime = Date.now() - 1000;

      mod.cleanupRateLimitStore();
      expect(mod.rateLimitStore.size).toBe(0);
    });
  });

  describe('Redis rate limiting', () => {
    it('should use Redis when credentials available', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://test';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

      mockRatelimitLimit.mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 5,
        reset: Date.now() + 1000,
      });

      const limiter = mod.rateLimit({ max: 10, windowMs: 1000 });
      const req = new Request('http://localhost', { headers: { 'x-forwarded-for': '6.6.6.6' } });

      const res = await limiter(req);
      expect(res.success).toBe(true);
      expect(res.remaining).toBe(5);
      expect(require('@upstash/redis').Redis).toHaveBeenCalled();
    });

    it('should fallback to in-memory on Redis error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://test';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

      mockRatelimitLimit.mockRejectedValue(new Error('Redis error'));

      const limiter = mod.rateLimit({ max: 5, windowMs: 1000 });
      const req = new Request('http://localhost', { headers: { 'x-forwarded-for': '7.7.7.7' } });

      const res = await limiter(req);
      expect(res.success).toBe(true);
      expect(res.remaining).toBe(4); // In-memory
    });

    it('should skip Redis when DISABLE_UPSTASH_DURING_BUILD is set', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'http://test';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      process.env.DISABLE_UPSTASH_DURING_BUILD = '1';

      const limiter = mod.rateLimit({ max: 5, windowMs: 1000 });
      const req = new Request('http://localhost', { headers: { 'x-forwarded-for': '8.8.8.8' } });

      const res = await limiter(req);
      expect(res.success).toBe(true);
      expect(res.remaining).toBe(4); // In-memory
      expect(require('@upstash/redis').Redis).not.toHaveBeenCalled();
    });
  });
});
