// Jest test for dbConnect.ts

describe('dbConnect', () => {
  const OLD_ENV = process.env;
  let originalGlobal;

beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    originalGlobal = { ...global };
    // Clear mongoose cache on global
    if ((global as any).mongoose) {
      delete (global as any).mongoose;
    }
  });

  afterEach(() => {
    process.env = OLD_ENV;
    if (global.mongoose !== undefined) { delete (global as any).mongoose; }
  });

  it('throws if MONGODB_URI is missing', async () => {
    jest.resetModules();
    jest.doMock('mongoose', () => ({ connect: jest.fn() }), { virtual: true });
    process.env.MONGODB_URI = '';
    (global as any).mongoose = {};
    const mod = await import('../lib/dbConnect');
    await expect(mod.default()).rejects.toThrow(/Invalid or missing MONGODB_URI/);
    jest.dontMock('mongoose');
  });

  it('returns cached connection if available', async () => {
    jest.resetModules();
    jest.doMock('mongoose', () => ({ connect: jest.fn() }), { virtual: true });
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = { conn: 'cached', promise: Promise.resolve('cached') };
    const mod = await import('../lib/dbConnect');
    const conn = await mod.default();
    expect(conn).toBe('cached');
    jest.dontMock('mongoose');
  });

  it('connects and caches connection', async () => {
    jest.resetModules();
    jest.doMock('mongoose', () => ({
      connect: jest.fn().mockResolvedValue({
        readyState: 1,
        connection: { readyState: 1 }
      })
    }), { virtual: true });
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = undefined;
    const mod = await import('../lib/dbConnect');
    const conn = await mod.default();
    expect(conn).toEqual({ readyState: 1, connection: { readyState: 1 } });
    jest.dontMock('mongoose');
  });

  it('resets cache on connection error', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = undefined;
    jest.resetModules();
    jest.doMock('mongoose', () => ({
      connect: jest.fn().mockRejectedValue(new Error('fail'))
    }), { virtual: true });
    const mod = await import('../lib/dbConnect');
    await expect(mod.default()).rejects.toThrow(/MongoDB connection error/);
    expect((global as any).mongoose.conn).toBeNull();
    expect((global as any).mongoose.promise).toBeNull();
    jest.dontMock('mongoose');
  });

  it('throws on malformed URI', async () => {
    process.env.MONGODB_URI = 'bad-uri';
    (global as any).mongoose = undefined;
    const mod = await import('../lib/dbConnect');
    await expect(mod.default()).rejects.toThrow(/Invalid or missing MONGODB_URI/);
  });

  it('throws if mongoose.connect throws synchronously', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = undefined;
    jest.resetModules();
    jest.doMock('mongoose', () => ({
      connect: () => { throw new Error('sync fail'); }
    }), { virtual: true });
    const mod = await import('../lib/dbConnect');
    await expect(mod.default()).rejects.toThrow(/Failed to connect to MongoDB/);
    jest.dontMock('mongoose');
  });

  it('throws if mongooseInstance is invalid', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = undefined;
    jest.resetModules();
    jest.doMock('mongoose', () => ({
      connect: jest.fn().mockResolvedValue({})
    }), { virtual: true });
    const mod = await import('../lib/dbConnect');
    await expect(mod.default()).rejects.toThrow(/did not return a valid connection/);
    jest.dontMock('mongoose');
  });
});