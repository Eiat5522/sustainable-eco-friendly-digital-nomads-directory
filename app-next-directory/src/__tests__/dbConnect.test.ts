// Jest test for dbConnect.ts

describe('dbConnect', () => {
  const OLD_ENV = process.env;
  let originalGlobal;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    originalGlobal = { ...global };
  });

  afterEach(() => {
    process.env = OLD_ENV;
    if (global.mongoose !== undefined) { delete (global as any).mongoose; }
  });

  it('throws if MONGODB_URI is missing', async () => {
    process.env.MONGODB_URI = '';
    // Ensure global.mongoose is defined to avoid undefined errors
    (global as any).mongoose = {};
    const mod = require('../lib/dbConnect');
    await expect(mod.default()).rejects.toThrow(/Invalid or missing MONGODB_URI/);
  });

  it('returns cached connection if available', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    // Patch global.mongoose to match expected cache structure
    (global as any).mongoose = { conn: 'cached', promise: Promise.resolve('cached') };
    const mod = jest.requireActual('../lib/dbConnect');
    const conn = await mod.default();
    expect(conn).toBe('cached');
  });

  it('connects and caches connection', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = undefined;
    const mockMongoose = {
      connect: jest.fn().mockResolvedValue({ connection: {} }),
    };
    jest.mock('mongoose', () => mockMongoose);
    const mod = jest.requireActual('../lib/dbConnect');
    const conn = await mod.default();
    expect(conn).toEqual({ connection: {} });
  });

  it('resets cache on connection error', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = undefined;
    const mockMongoose = {
      connect: jest.fn().mockRejectedValue(new Error('fail')),
    };
    jest.mock('mongoose', () => mockMongoose);
    const mod = jest.requireActual('../lib/dbConnect');
    await expect(mod.default()).rejects.toThrow(/MongoDB connection error/);
    expect((global as any).mongoose.conn).toBeNull();
    expect((global as any).mongoose.promise).toBeNull();
  });

  it('throws on malformed URI', async () => {
    process.env.MONGODB_URI = 'bad-uri';
    (global as any).mongoose = undefined;
    const mod = jest.requireActual('../lib/dbConnect');
    await expect(mod.default()).rejects.toThrow(/Invalid or missing MONGODB_URI/);
  });

  it('throws if mongoose.connect throws synchronously', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = undefined;
    const mockMongoose = {
      connect: () => { throw new Error('sync fail'); },
    };
    jest.mock('mongoose', () => mockMongoose);
    const mod = jest.requireActual('../lib/dbConnect');
    await expect(mod.default()).rejects.toThrow(/Failed to connect to MongoDB/);
  });

  it('throws if mongooseInstance is invalid', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    (global as any).mongoose = undefined;
    const mockMongoose = {
      connect: jest.fn().mockResolvedValue({}),
    };
    jest.mock('mongoose', () => mockMongoose);
    const mod = jest.requireActual('../lib/dbConnect');
    await expect(mod.default()).rejects.toThrow(/did not return a valid connection/);
  });
});