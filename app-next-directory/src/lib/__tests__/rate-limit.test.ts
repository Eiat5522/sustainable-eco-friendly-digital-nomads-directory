const loadModule = async (setup?: () => void) => {
  jest.resetModules();
  jest.unmock('../rate-limit');
  jest.unmock('@/lib/rate-limit');
  setup?.();
  return jest.requireActual<typeof import('../rate-limit')>('../rate-limit');
};

describe('rate-limit helpers', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('wraps exports with jest.fn when Jest is available', async () => {
    const originalJest = (global as any).jest;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const mod = await loadModule(() => {
        (global as any).jest = { fn: jest.fn.bind(jest) };
      });
      const { getClientIp, isRateLimited, getRetryAfterMs } = mod;

      expect(typeof (getClientIp as any).mock).toBe('object');

      const request = {
        headers: {
          get: (key: string) => {
            if (key === 'x-forwarded-for') return '203.0.113.10, 70.0.0.1';
            if (key === 'x-real-ip') return '198.51.100.5';
            return null;
          },
        },
      } as unknown as Request;

      expect(getClientIp(request)).toBe('203.0.113.10');
      const fallbackRequest = {
        headers: {
          get: (key: string) => (key === 'x-real-ip' ? '198.51.100.5' : null),
        },
      } as unknown as Request;
      expect(getClientIp(fallbackRequest)).toBe('198.51.100.5');
      expect(getClientIp({ headers: { get: () => null } } as unknown as Request)).toBe('unknown');

      expect(isRateLimited('bad-limit', Number.POSITIVE_INFINITY, 60)).toBe(true);
      expect(isRateLimited('non-positive', 0, 60)).toBe(true);

      let now = 0;
      const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);

      expect(isRateLimited('ip', 2, 1)).toBe(false);
      now = 10;
      expect(isRateLimited('ip', 2, 1)).toBe(false);
      now = 20;
      expect(isRateLimited('ip', 2, 1)).toBe(true);
      expect(getRetryAfterMs('ip')).toBeGreaterThan(0);

      now = 2_000;
      expect(isRateLimited('ip', 2, 1)).toBe(false);
      expect(getRetryAfterMs('ip')).toBeGreaterThanOrEqual(0);

      now = 0;
      expect(isRateLimited('cleanup', 1, 0.01)).toBe(false);
      now = 70_000;
      expect(getRetryAfterMs('cleanup')).toBe(0);
      expect(isRateLimited('cleanup', 1, 1)).toBe(false);

      nowSpy.mockRestore();
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      (global as any).jest = originalJest;
      warnSpy.mockRestore();
    }
  });

  it('evicts the oldest buckets when capacity is exceeded', async () => {
    const mod = await loadModule(() => {
      delete (global as any).jest;
    });
    const { isRateLimited } = mod;
    let now = 0;
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);

    const MAX_BUCKETS = 10_000;
    for (let i = 0; i <= MAX_BUCKETS; i += 1) {
      expect(isRateLimited(`key-${i}`, 1, 10_000)).toBe(false);
    }

    now = 60_000;
    expect(isRateLimited('trigger-cleanup', 1, 10_000)).toBe(false);

    now = 60_001;
    expect(isRateLimited('key-0', 1, 10_000)).toBe(false);

    nowSpy.mockRestore();
  });

  it('falls back to original functions when Jest is unavailable', async () => {
    const originalJest = (global as any).jest;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const mod = await loadModule(() => {
        delete (global as any).jest;
      });

      expect('mock' in (mod.getClientIp as any)).toBe(false);
      expect('mock' in (mod.isRateLimited as any)).toBe(false);
      expect('mock' in (mod.getRetryAfterMs as any)).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith('Jest not available for mocking in rate-limit module');
    } finally {
      (global as any).jest = originalJest;
      warnSpy.mockRestore();
    }
  });

  it('returns zero retry time for unknown keys', async () => {
    const originalJest = (global as any).jest;
    try {
      const mod = await loadModule(() => {
        (global as any).jest = { fn: jest.fn.bind(jest) };
      });
      expect(mod.getRetryAfterMs('missing')).toBe(0);
    } finally {
      (global as any).jest = originalJest;
    }
  });
});
