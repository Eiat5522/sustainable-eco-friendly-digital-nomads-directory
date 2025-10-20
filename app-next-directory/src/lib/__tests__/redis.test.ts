import { jest } from '@jest/globals';

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

  it('throws a helpful error when redis credentials are missing', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('@upstash/redis', () => ({ Redis: jest.fn() }));
      const mod = await import('../redis');
      expect(() => mod.createRedisClient()).toThrow(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set'
      );
    });
  });

  it('creates a redis client with credentials when available', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token-123';

    const redisInstance = { id: 'redis-instance' } as unknown as import('@upstash/redis').Redis;

    let redisCtor: jest.Mock;

    const mod = await (async () => {
      let module: typeof import('../redis');
      await jest.isolateModulesAsync(async () => {
        redisCtor = jest.fn(() => redisInstance);
        jest.doMock('@upstash/redis', () => ({ Redis: redisCtor }));
        module = await import('../redis');
      });
      return module!;
    })();

    const client = mod.createRedisClient();

    expect(redisCtor!).toHaveBeenCalledWith({ url: 'https://redis.upstash.io', token: 'token-123' });
    expect(client).toBe(redisInstance);
  });

  it('exposes mock helpers for getRedisClient in test environments', async () => {
    const module = await loadModule();
    const getter = module.getRedisClient as unknown as jest.Mock;

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
    const module = await loadModule();
    const unsubscribeCalls: Array<ReturnType<typeof module.setRedisClient>> = [];
    const listener = jest.fn();
    const otherListener = jest
      .fn()
      .mockImplementationOnce(() => undefined)
      .mockImplementation(() => {
        throw new Error('listener failure');
      });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const unsubscribe = module.onRedisClientChange(listener);
    module.onRedisClientChange(otherListener);
    unsubscribeCalls.push(unsubscribe);

    expect(listener).toHaveBeenCalledWith(undefined);

    const clientA = { id: 'client-a' } as unknown as import('@upstash/redis').Redis;
    module.setRedisClient(clientA);

    expect(listener).toHaveBeenLastCalledWith(clientA);
    expect(warnSpy).toHaveBeenCalledWith('[redis] listener threw error', expect.any(Error));

    unsubscribe();

    const clientB = { id: 'client-b' } as unknown as import('@upstash/redis').Redis;
    module.setRedisClient(clientB);

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

    let module: typeof import('../redis');
    let ctor: jest.Mock;

    await jest.isolateModulesAsync(async () => {
      ctor = jest.fn(() => redisInstance);
      jest.doMock('@upstash/redis', () => ({ Redis: ctor }));
      module = await import('../redis');
    });

    const first = module!.getRedisClient();
    const second = module!.getRedisClient();

    expect(first).toBe(redisInstance);
    expect(second).toBe(redisInstance);
    expect(ctor!).toHaveBeenCalledTimes(1);
    expect((module!.getRedisClient as Record<string, unknown>).mockReturnValue).toBeUndefined();
  });

  it('provides a default mock redis client in tests', async () => {
    const module = await loadModule();
    const mockClient = module.mockRedisClient;

    expect(mockClient).toBeDefined();
    await expect(mockClient?.get?.('key')).resolves.toBeNull();
    await expect(mockClient?.set?.('key', 'value')).resolves.toBe('OK');
    await expect(mockClient?.del?.('key')).resolves.toBe(0);
    await expect(mockClient?.incr?.('key')).resolves.toBe(0);
    await expect(mockClient?.expire?.('key', 60)).resolves.toBe(0);
    await expect(mockClient?.ping?.()).resolves.toBe('PONG');
  });
});
