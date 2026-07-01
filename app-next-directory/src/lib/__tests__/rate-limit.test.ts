import { jest } from '@jest/globals';

// Mock the redis module before importing rate-limit
const mockRedisClient = {
  evalsha: jest.fn(),
};

const mockGetRedisClient = jest.fn(() => mockRedisClient);

jest.mock('@/lib/redis', () => ({
  __esModule: true,
  getRedisClient: mockGetRedisClient,
}));

// Mock Upstash rate limit
const mockRatelimitLimit = jest.fn();
const mockRatelimitInstance = {
  limit: mockRatelimitLimit,
};

const mockRatelimitConstructor = jest.fn(() => mockRatelimitInstance);
mockRatelimitConstructor.slidingWindow = jest.fn((limit: number, window: string) => ({
  limit,
  window,
}));

jest.mock('@upstash/ratelimit', () => ({
  __esModule: true,
  Ratelimit: mockRatelimitConstructor,
}));

// Mock unified IP utility
const mockGetIp = jest.fn((req: any) => {
  const xf = req?.headers?.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  const xr = req?.headers?.get('x-real-ip');
  if (xr) return xr;
  return 'unknown';
});

jest.mock('@/utils/ip', () => ({
  getClientIp: mockGetIp,
}));

const warnSpy = jest.fn();

const loadModule = async (setup?: () => void) => {
  jest.resetModules();
  jest.clearAllMocks();
  setup?.();

  // Re-mock after reset
  jest.doMock('@/lib/redis', () => ({
    __esModule: true,
    getRedisClient: mockGetRedisClient,
  }));

  jest.doMock('@upstash/ratelimit', () => ({
    __esModule: true,
    Ratelimit: mockRatelimitConstructor,
  }));

  jest.doMock('@/utils/ip', () => ({
    getClientIp: mockGetIp,
  }));

  jest.doMock('@/lib/logger', () => ({
    structuredLogger: { warn: warnSpy, error: jest.fn(), info: jest.fn(), debug: jest.fn() },
  }));

  return jest.requireActual<typeof import('../rate-limit')>('../rate-limit');
};

describe('rate-limit helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRedisClient.mockReturnValue(mockRedisClient);
    mockRatelimitLimit.mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('initializes rate limiters with Redis client', async () => {
    const mod = await loadModule();

    expect(mockGetRedisClient).toHaveBeenCalled();
    expect(mockRatelimitConstructor).toHaveBeenCalledTimes(2); // login and api rate limiters
  });

  it('getClientIp delegates to unified IP utility', async () => {
    const mod = await loadModule();
    const request = { headers: { get: () => '1.2.3.4' } } as any;

    mod.getClientIp(request);

    expect(mockGetIp).toHaveBeenCalledWith(request);
  });

  it('isRateLimited returns false when request is allowed', async () => {
    const mod = await loadModule();
    mockRatelimitLimit.mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    });

    const result = await mod.isRateLimited('test-key', 10, 60);

    expect(result).toBe(false);
    expect(mockRatelimitLimit).toHaveBeenCalledWith('test-key');
  });

  it('isRateLimited returns true when rate limit is exceeded', async () => {
    const mod = await loadModule();
    mockRatelimitLimit.mockResolvedValue({
      success: false,
      limit: 100,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const result = await mod.isRateLimited('test-key', 10, 60);

    expect(result).toBe(true);
  });

  it('isRateLimited returns false when Redis is not available', async () => {
    mockGetRedisClient.mockReturnValue(undefined);
    const mod = await loadModule();

    const result = await mod.isRateLimited('test-key', 10, 60);

    expect(result).toBe(false);
  });

  it('isRateLimited handles errors gracefully', async () => {
    const mod = await loadModule();
    mockRatelimitLimit.mockRejectedValue(new Error('Redis error'));

    const result = await mod.isRateLimited('test-key', 10, 60);

    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      '[rate-limit] Error checking rate limit',
      expect.any(Error),
      { component: 'rate-limit' }
    );
  });

  it('getRetryAfterMs returns time until reset', async () => {
    const mod = await loadModule();
    const futureReset = Date.now() + 30000;
    mockRatelimitLimit.mockResolvedValue({
      success: false,
      limit: 100,
      remaining: 0,
      reset: futureReset,
    });

    const result = await mod.getRetryAfterMs('test-key');

    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(30000);
  });

  it('getRetryAfterMs returns 0 when Redis is not available', async () => {
    mockGetRedisClient.mockReturnValue(undefined);
    const mod = await loadModule();

    const result = await mod.getRetryAfterMs('test-key');

    expect(result).toBe(0);
  });

  it('getRetryAfterMs handles errors gracefully', async () => {
    const mod = await loadModule();
    mockRatelimitLimit.mockRejectedValue(new Error('Redis error'));

    const result = await mod.getRetryAfterMs('test-key');

    expect(result).toBe(0);
  });

  it('wraps exports with jest.fn when Jest is available', async () => {
    const originalJest = (global as any).jest;

    try {
      const mod = await loadModule(() => {
        (global as any).jest = { fn: jest.fn.bind(jest) };
      });
      const { getClientIp, isRateLimited, getRetryAfterMs } = mod;

      expect(typeof (getClientIp as any).mock).toBe('object');
    } finally {
      (global as any).jest = originalJest;
    }
  });

  it('handles Redis initialization errors gracefully', async () => {
    mockGetRedisClient.mockImplementation(() => {
      throw new Error('Redis connection failed');
    });

    const mod = await loadModule();

    expect(warnSpy).toHaveBeenCalledWith(
      '[rate-limit] Failed to initialize rate limiters',
      expect.any(Error),
      { component: 'rate-limit' }
    );

    const result = await mod.isRateLimited('test-key', 10, 60);
    expect(result).toBe(false);
  });
});
