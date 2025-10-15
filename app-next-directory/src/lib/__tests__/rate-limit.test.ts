import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('rate-limit utilities', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.unmock('../rate-limit');
    jest.unmock('@/lib/rate-limit');
    process.env = { ...ORIGINAL_ENV, NODE_ENV: 'test' };
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = { ...ORIGINAL_ENV };
  });

  const loadModule = async () => {
    const mod = await import('../rate-limit');
    const getClientIp = mod.getClientIp.getMockImplementation?.() ?? mod.getClientIp;
    const isRateLimited = mod.isRateLimited.getMockImplementation?.() ?? mod.isRateLimited;
    const getRetryAfterMs = mod.getRetryAfterMs.getMockImplementation?.() ?? mod.getRetryAfterMs;
    return { ...mod, getClientIp, isRateLimited, getRetryAfterMs };
  };

  it('prefers x-forwarded-for and x-real-ip headers', async () => {
    const { getClientIp } = await loadModule();
    const req = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': '203.0.113.1, 10.0.0.5',
        'x-real-ip': '198.51.100.9',
      },
    });

    expect(getClientIp(req)).toBe('203.0.113.1');
  });

  it('enforces the rate limit window and exposes retry delay', async () => {
    const { isRateLimited, getRetryAfterMs } = await loadModule();
    const key = 'ip:203.0.113.1';

    expect(isRateLimited(key, 2, 60)).toBe(false);
    expect(isRateLimited(key, 2, 60)).toBe(false);
    expect(isRateLimited(key, 2, 60)).toBe(true);

    const retry = getRetryAfterMs(key);
    expect(retry).toBeGreaterThan(0);

    jest.advanceTimersByTime(60_000);

    expect(isRateLimited(key, 2, 60)).toBe(false);
  });

  it('treats invalid configuration values as rate limited', async () => {
    const { isRateLimited } = await loadModule();

    expect(isRateLimited('invalid', Number.NaN, 10)).toBe(true);
    expect(isRateLimited('invalid-window', 5, Number.NaN)).toBe(true);
  });
});
