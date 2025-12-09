import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

const connectMock = jest.fn();
const mongooseMock = {
  connect: connectMock,
  connection: { readyState: 1 },
};

jest.mock('mongoose', () => ({
  __esModule: true,
  default: mongooseMock,
}));

const ORIGINAL_ENV = { ...process.env } as Record<string, string | undefined>;

const resetGlobalMongoose = () => {
  delete (global as typeof globalThis & { mongoose?: unknown }).mongoose;
};

const loadDbConnect = async () => {
  const mod = await import('../dbConnect');
  return mod.default;
};

describe('dbConnect helper', () => {
  beforeEach(() => {
    jest.resetModules();
    connectMock.mockReset();
    resetGlobalMongoose();
    process.env = {
      ...ORIGINAL_ENV,
      MONGODB_URI: 'mongodb://localhost:27017/testdb',
      JEST_WORKER_ID: '1',
      JEST_USE_REAL_MONGOOSE: '1',
    };
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    resetGlobalMongoose();
  });

  describe('in Jest environments', () => {
    it('connects once and caches the resolved mongoose instance', async () => {
      const dbConnect = await loadDbConnect();
      const connection = { connection: { readyState: 1 } } as unknown as typeof mongooseMock;
      connectMock.mockResolvedValue(connection);

      const first = await dbConnect();
      const second = await dbConnect();

      expect(connectMock).toHaveBeenCalledTimes(1);
      expect(connectMock).toHaveBeenCalledWith('mongodb://localhost:27017/testdb', {
        bufferCommands: false,
      });
      expect(first).toBe(connection);
      expect(second).toBe(connection);
      expect(dbConnect.mock.calls.length).toBe(2);
      expect(dbConnect.mock.results.map(r => r.type)).toEqual(['return', 'return']);
    });

    it('deduplicates concurrent connection attempts', async () => {
      const dbConnect = await loadDbConnect();
      const connection = { connection: { readyState: 1 } } as unknown as typeof mongooseMock;

      let resolveConnect: (value: unknown) => void = () => {};
      const connectPromise = new Promise<unknown>(resolve => {
        resolveConnect = resolve;
      });
      connectMock.mockReturnValueOnce(connectPromise);

      const [a, b, c] = [dbConnect(), dbConnect(), dbConnect()];
      resolveConnect(connection);

      const results = await Promise.all([a, b, c]);

      expect(connectMock).toHaveBeenCalledTimes(1);
      expect(new Set(results)).toEqual(new Set([connection]));
      expect(dbConnect.mock.calls.length).toBe(3);
    });

    it('resets the cached promise when mongoose.connect rejects', async () => {
      const dbConnect = await loadDbConnect();
      const failure = new Error('connect failed');
      connectMock.mockRejectedValueOnce(failure);

      await expect(dbConnect()).rejects.toThrow('connect failed');
      expect(connectMock).toHaveBeenCalledTimes(1);

      const connection = { connection: { readyState: 1 } } as unknown as typeof mongooseMock;
      connectMock.mockResolvedValueOnce(connection);

      const retry = await dbConnect();
      expect(connectMock).toHaveBeenCalledTimes(2);
      expect(retry).toBe(connection);
      expect(dbConnect.mock.results[0].type).toBe('throw');
      expect(dbConnect.mock.results[1].type).toBe('return');
    });

    it('exposes jest-style helpers for overriding the implementation', async () => {
      const dbConnect = await loadDbConnect();

      expect(dbConnect._isMockFunction).toBe(true);
      expect(typeof dbConnect.mock).toBe('object');

      const customConnection = { custom: true } as unknown as typeof mongooseMock;
      dbConnect.mockImplementation(async () => customConnection);
      expect(await dbConnect()).toBe(customConnection);
      expect(dbConnect.mock.calls.length).toBe(1);

      dbConnect.mockClear();
      expect(dbConnect.mock.calls.length).toBe(0);

      const resolved = { resolved: true } as unknown as typeof mongooseMock;
      dbConnect.mockResolvedValue(resolved);
      await expect(dbConnect()).resolves.toBe(resolved);

      const rejection = new Error('override failure');
      dbConnect.mockRejectedValue(rejection);
      await expect(dbConnect()).rejects.toThrow('override failure');

      dbConnect.mockReset();
      expect(dbConnect.mock.calls.length).toBe(0);
      const connection = { connection: { readyState: 1 } } as unknown as typeof mongooseMock;
      connectMock.mockResolvedValueOnce(connection);
      await expect(dbConnect()).resolves.toBe(connection);

      dbConnect.mockName('custom-name');
      expect(dbConnect.getMockName()).toBe('custom-name');
      expect(dbConnect.mock.name).toBe('custom-name');
    });
  });

  it('throws when calling dbConnect with missing MONGODB_URI in non-Jest mode', async () => {
    delete process.env.MONGODB_URI;
    delete process.env.JEST_WORKER_ID;
    delete process.env.SKIP_DB_CONNECT;
    delete process.env.JEST_USE_REAL_MONGOOSE;
    jest.resetModules();
    resetGlobalMongoose();

    const { default: dbConnect } = await import('../dbConnect');
    // In non-Jest mode, dbConnect becomes connectWithCaching which validates on call
    await expect(dbConnect()).rejects.toThrow(
      'MONGODB_URI environment variable is required'
    );
  });

  it('uses real caching logic outside of Jest environments', async () => {
    delete process.env.JEST_WORKER_ID;
    delete process.env.SKIP_DB_CONNECT;
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    resetGlobalMongoose();

    const { default: dbConnect } = await import('../dbConnect');
    const connection = { connection: { readyState: 1 } } as unknown as typeof mongooseMock;
    connectMock.mockResolvedValue(connection);

    const first = await dbConnect();
    const second = await dbConnect();

    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(first).toBe(connection);
    expect(second).toBe(connection);
  });
});
