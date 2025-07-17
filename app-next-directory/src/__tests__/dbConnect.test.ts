

// FORTEST: Add global unhandledRejection handler to debug async issues

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
    // Remove dbConnect and mongoose from require cache if present
    const dbConnectPath = require.resolve('../lib/dbConnect');
    if (require.cache[dbConnectPath]) delete require.cache[dbConnectPath];
    try {
      const mongoosePath = require.resolve('mongoose');
      if (require.cache[mongoosePath]) delete require.cache[mongoosePath];
    } catch {}
  });

  afterEach(async () => {
    process.env = OLD_ENV;
    if (global.mongoose !== undefined) { delete (global as any).mongoose; }
    // Ensure all mocks are cleared and any open mongoose connections are closed
    jest.clearAllMocks();
    jest.resetAllMocks();
    // If mongoose connection exists and has a close method, close it
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection && typeof mongoose.connection.close === 'function') {
        await mongoose.connection.close();
      }
    } catch {}
  });

  it('throws if MONGODB_URI is missing', async () => {
    // Set env before resetting modules to ensure fresh import sees the right value
    // Remove MONGODB_URI from env to simulate missing variable
    if ('MONGODB_URI' in process.env) {
      delete (process.env as any)['MONGODB_URI'];
    }
    jest.resetModules();
    delete (global as any).mongoose;
    jest.doMock('mongoose', () => ({ connect: jest.fn().mockResolvedValue({ db: jest.fn() }) }), { virtual: true });
    // FORTEST: Log to verify env
    // eslint-disable-next-line no-console
    console.log('FORTEST: MONGODB_URI in test:', process.env.MONGODB_URI);
    const dbConnectModule = await import('../lib/dbConnect');
    const dbConnect = dbConnectModule.default;
    return expect(dbConnect()).rejects.toThrow(/Invalid or missing MONGODB_URI/);
    jest.dontMock('mongoose');
  });

  // Additional tests for dbConnect.ts, focusing on edge cases and cache behavior

  it('does not re-connect if cached.conn is set and valid', async () => {
    jest.resetModules();
    const mockConnect = jest.fn();
    jest.doMock('mongoose', () => ({ connect: mockConnect }), { virtual: true });
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = { conn: { readyState: 1 }, promise: Promise.resolve({ readyState: 1 }) };
    const dbConnectModule = await import('../lib/dbConnect');
    const dbConnect = dbConnectModule.default;
    const conn = await dbConnect();
    expect(conn).toEqual({ readyState: 1 });
    expect(mockConnect).not.toHaveBeenCalled();
    jest.dontMock('mongoose');
  });

  it('sets cached.conn after successful connection', async () => {
    jest.resetModules();
    jest.doMock('mongoose', () => ({
      connect: jest.fn().mockResolvedValue({ readyState: 1, connection: { readyState: 1 } })
    }), { virtual: true });
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = { conn: null, promise: null };
    const dbConnectModule = await import('../lib/dbConnect');
    const dbConnect = dbConnectModule.default;
    await dbConnect();
    expect((global as any).mongoose.conn).toEqual({ readyState: 1, connection: { readyState: 1 } });
    jest.dontMock('mongoose');
  });

  it('throws error if mongoose.connect returns null', async () => {
    jest.resetModules();
    jest.doMock('mongoose', () => ({
      connect: jest.fn().mockResolvedValue(null)
    }), { virtual: true });
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = undefined;
    const dbConnectModule = await import('../lib/dbConnect');
    const dbConnect = dbConnectModule.default;
    await expect(dbConnect()).rejects.toThrow(/did not return a valid connection/);
    jest.dontMock('mongoose');
  });

  it('throws error if mongoose.connect returns undefined', async () => {
    jest.resetModules();
    jest.doMock('mongoose', () => ({
      connect: jest.fn().mockResolvedValue(undefined)
    }), { virtual: true });
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = undefined;
    const dbConnectModule = await import('../lib/dbConnect');
    const dbConnect = dbConnectModule.default;
    await expect(dbConnect()).rejects.toThrow(/did not return a valid connection/);
    jest.dontMock('mongoose');
  });

  it('throws error if mongoose.connect returns object without readyState', async () => {
    jest.resetModules();
    jest.doMock('mongoose', () => ({
      connect: jest.fn().mockResolvedValue({ connection: {} })
    }), { virtual: true });
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = undefined;
    const dbConnectModule = await import('../lib/dbConnect');
    const dbConnect = dbConnectModule.default;
    await expect(dbConnect()).rejects.toThrow(/did not return a valid connection/);
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
    const dbConnectModule = await import('../lib/dbConnect');
    const dbConnect = dbConnectModule.default;
    const conn = await dbConnect();
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
    const dbConnectModule = await import('../lib/dbConnect');
    const dbConnect = dbConnectModule.default;
    await expect(dbConnect()).rejects.toThrow(/MongoDB connection error/);
    expect((global as any).mongoose.conn).toBeNull();
    expect((global as any).mongoose.promise).toBeNull();
    jest.dontMock('mongoose');
  });

  it('throws on malformed URI', async () => {
    jest.resetModules();
    delete (global as any).mongoose;
    process.env.MONGODB_URI = 'bad-uri';
    jest.doMock('mongoose', () => ({ connect: jest.fn().mockResolvedValue({ db: jest.fn() }) }), { virtual: true });
    const dbConnectModule = await import('../lib/dbConnect');
    const dbConnect = dbConnectModule.default;
    await expect(dbConnect()).rejects.toThrow(/Invalid or missing MONGODB_URI/);
    jest.dontMock('mongoose');
  });

  it('throws if mongoose.connect throws synchronously', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = undefined;
    jest.resetModules();
    jest.doMock('mongoose', () => ({
      connect: () => { throw new Error('sync fail'); }
    }), { virtual: true });
    const dbConnectModule = await import('../lib/dbConnect');
    const dbConnect = dbConnectModule.default;
    await expect(dbConnect()).rejects.toThrow(/Failed to connect to MongoDB/);
    jest.dontMock('mongoose');
  });

  it('throws if mongooseInstance is invalid', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = undefined;
    jest.resetModules();
    jest.doMock('mongoose', () => ({
      connect: jest.fn().mockResolvedValue({})
    }), { virtual: true });
    const dbConnectModule = await import('../lib/dbConnect');
    const dbConnect = dbConnectModule.default;
    await expect(dbConnect()).rejects.toThrow(/did not return a valid connection/);
    jest.dontMock('mongoose');
  });
});