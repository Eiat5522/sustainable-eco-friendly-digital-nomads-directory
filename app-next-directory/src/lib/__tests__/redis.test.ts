import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('redis module', () => {
  const originalEnv = process.env;
  const loadModule = async () => {
    let mod: typeof import('../redis');
    await jest.isolateModulesAsync(async () => {
      mod = await import('../redis');
    });
    return mod!;
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv, NODE_ENV: 'test', JEST_WORKER_ID: '1' };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('returns undefined when redis credentials are missing', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@upstash/redis', () => ({ Redis: jest.fn() }));
      const mod = await import('../redis');
      expect(mod.createRedisClient()).toBeUndefined();
    });
  });

  it('creates a redis client with credentials when available', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token-123';

    const redisInstance = { id: 'redis-instance' } as unknown as import('@upstash/redis').Redis;

    let redisCtor: jest.Mock;

    const mod = await (async () => {
      let redisModule: typeof import('../redis');
      await jest.isolateModulesAsync(async () => {
        redisCtor = jest.fn(() => redisInstance);
        jest.doMock('@upstash/redis', () => ({ Redis: redisCtor }));
        redisModule = await import('../redis');
      });
      return redisModule!;
    })();

    const client = mod.createRedisClient();

    expect(redisCtor!).toHaveBeenCalledWith({ url: 'https://redis.upstash.io', token: 'token-123' });
    expect(client).toBe(redisInstance);
  });

  it('exposes mock helpers for getRedisClient in test environments', async () => {
    const redisModule = await loadModule();
    const getter = redisModule.getRedisClient as unknown as jest.Mock;

    expect(getter()).toBeUndefined();

    const mockClient = { client: true } as unknown as import('@upstash/redis').Redis;

    getter.mockReturnValue(mockClient);
    expect(getter()).toBe(mockClient);

    getter.mockClear();
    expect(getter()).toBeUndefined();

    getter.mockReturnValue(mockClient);
    getter.mockReset();
    expect(getter()).toBeUndefined();
  });

  it('allows manually setting and subscribing to redis client updates', async () => {
    const redisModule = await loadModule();
    const unsubscribeCalls: Array<ReturnType<typeof redisModule.setRedisClient>> = [];
    const listener = jest.fn();
    const otherListener = jest
      .fn()
      .mockImplementationOnce(() => undefined)
      .mockImplementation(() => {
        throw new Error('listener failure');
      });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const unsubscribe = redisModule.onRedisClientChange(listener);
    redisModule.onRedisClientChange(otherListener);
    unsubscribeCalls.push(unsubscribe);

    expect(listener).toHaveBeenCalledWith(undefined);

    const clientA = { id: 'client-a' } as unknown as import('@upstash/redis').Redis;
    redisModule.setRedisClient(clientA);

    expect(listener).toHaveBeenLastCalledWith(clientA);
    expect(warnSpy).toHaveBeenCalledWith('[redis] listener threw error', expect.any(Error));

    unsubscribe();

    const clientB = { id: 'client-b' } as unknown as import('@upstash/redis').Redis;
    redisModule.setRedisClient(clientB);

    expect(listener).not.toHaveBeenLastCalledWith(clientB);

    warnSpy.mockRestore();
    unsubscribeCalls.forEach(off => off?.());
  });

  it('instantiates a redis client automatically outside of test environments', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JEST_WORKER_ID;
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.prod';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'prod-token';

    const redisInstance = { id: 'prod-client' } as unknown as import('@upstash/redis').Redis;

    let redisModule: typeof import('../redis');
    let ctor: jest.Mock;

    await jest.isolateModulesAsync(async () => {
      ctor = jest.fn(() => redisInstance);
      jest.doMock('@upstash/redis', () => ({ Redis: ctor }));
      redisModule = await import('../redis');
    });

    const first = redisModule!.getRedisClient();
    const second = redisModule!.getRedisClient();

    expect(first).toBe(redisInstance);
    expect(second).toBe(redisInstance);
    expect(ctor!).toHaveBeenCalledTimes(1);
    expect((redisModule!.getRedisClient as Record<string, unknown>).mockReturnValue).toBeUndefined();
  });

  it('provides a default mock redis client in tests', async () => {
    const redisModule = await loadModule();
    const mockClient = redisModule.mockRedisClient;

    expect(mockClient).toBeDefined();
    await expect(mockClient?.get?.('key')).resolves.toBeNull();
    await expect(mockClient?.set?.('key', 'value')).resolves.toBe('OK');
    await expect(mockClient?.del?.('key')).resolves.toBe(0);
    await expect(mockClient?.incr?.('key')).resolves.toBe(0);
    await expect(mockClient?.expire?.('key', 60)).resolves.toBe(0);
    await expect(mockClient?.ping?.()).resolves.toBe('PONG');
  });
});

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

    await jest.isolateModulesAsync(async () => {
      jest.doMock('@upstash/redis', () => ({
        Redis: redisConstructor,
      }));
      const { getRedisClient } = await import('../redis');
      const client = getRedisClient();
      expect(client).toBeDefined();
    });

    expect(redisConstructor).toHaveBeenCalledWith({ url: 'https://example.com', token: 'token' });
  });

  it('returns undefined when credentials are missing', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const { createRedisClient } = await import('../redis');

    expect(createRedisClient()).toBeUndefined();
  });
});
