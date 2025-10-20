import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const redisConstructor = jest.fn(function Redis(this: any, config: Record<string, unknown>) {
  Object.assign(this, { config });
});

jest.mock('@upstash/redis', () => ({
  __esModule: true,
  Redis: redisConstructor,
}));

const ORIGINAL_ENV = { ...process.env } as Record<string, string | undefined>;

const resetEnv = () => {
  process.env = { ...ORIGINAL_ENV };
};

describe('redis helpers', () => {
  beforeEach(() => {
    jest.resetModules();
    redisConstructor.mockClear();
    resetEnv();
    process.env.NODE_ENV = 'test';
    process.env.JEST_WORKER_ID = process.env.JEST_WORKER_ID ?? '1';
  });

  afterEach(() => {
    resetEnv();
  });

  it('returns undefined redis client in test environments until set manually', async () => {
    const { getRedisClient } = await import('../redis');

    expect(getRedisClient()).toBeUndefined();
  });

  it('allows manually setting and retrieving the redis client', async () => {
    const { setRedisClient, getRedisClient } = await import('../redis');

    const client = { kind: 'manual-client' } as any;
    setRedisClient(client);

    expect(getRedisClient()).toBe(client);
  });

  it('notifies listeners immediately and upon subsequent updates', async () => {
    const { onRedisClientChange, setRedisClient } = await import('../redis');

    const listener = jest.fn();
    const unsubscribe = onRedisClientChange(listener);

    expect(listener).toHaveBeenCalledWith(undefined);

    const firstClient = { id: 1 } as any;
    setRedisClient(firstClient);
    expect(listener).toHaveBeenCalledWith(firstClient);

    unsubscribe();

    setRedisClient({ id: 2 } as any);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('supports jest-style helpers on getRedisClient in tests', async () => {
    const { getRedisClient } = await import('../redis');

    const mockClient = { id: 'mocked' } as any;
    getRedisClient.mockReturnValue(mockClient);
    expect(getRedisClient()).toBe(mockClient);

    getRedisClient.mockClear();
    expect(getRedisClient()).toBeUndefined();

    getRedisClient.mockReturnValue(mockClient);
    getRedisClient.mockReset();
    expect(getRedisClient()).toBeUndefined();
  });

  it('exposes a default mockRedisClient implementation in tests', async () => {
    const { mockRedisClient } = await import('../redis');

    await expect(mockRedisClient?.ping()).resolves.toBe('PONG');
    await expect(mockRedisClient?.set('key', 'value')).resolves.toBe('OK');
    await expect(mockRedisClient?.get('key')).resolves.toBeNull();
    await expect(mockRedisClient?.del('key')).resolves.toBe(0);
    await expect(mockRedisClient?.incr('key')).resolves.toBe(0);
    await expect(mockRedisClient?.expire('key', 10)).resolves.toBe(0);
  });

  it('logs a warning when a listener throws during notification', async () => {
    const { onRedisClientChange, setRedisClient } = await import('../redis');
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const error = new Error('listener failure');

    const unsubscribe = onRedisClientChange((client) => {
      if (client) {
        throw error;
      }
    });

    setRedisClient({ id: 3 } as any);

    expect(consoleSpy).toHaveBeenCalledWith('[redis] listener threw error', error);

    unsubscribe();
    consoleSpy.mockRestore();
  });

  it('creates real redis clients outside of test environments', async () => {
    resetEnv();
    process.env.NODE_ENV = 'production';
    delete process.env.JEST_WORKER_ID;
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.com';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

    jest.isolateModules(() => {
      const { getRedisClient } = require('../redis');
      const client = getRedisClient();
      expect(client).toBeDefined();
    });

    expect(redisConstructor).toHaveBeenCalledWith({ url: 'https://example.com', token: 'token' });
  });

  it('throws a descriptive error when credentials are missing', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { createRedisClient } = await import('../redis');

    expect(() => createRedisClient()).toThrow(
      'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set'
    );
  });
});
