import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';

const ORIGINAL_ENV = { ...process.env };

const loadDbConnect = async () => {
  const module = await import('../dbConnect');
  return module.default;
};

const getMongoose = async () => {
  const mod = await import('mongoose');
  return mod.default ?? (mod as unknown as typeof import('mongoose'));
};

describe('dbConnect (integration)', () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
  });

  beforeEach(() => {
    jest.resetModules();
    delete (global as typeof globalThis & { mongoose?: unknown }).mongoose;
    process.env.MONGODB_URI = mongo.getUri();
  });

  afterEach(async () => {
    const mongoose = await getMongoose();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase().catch(() => {});
      await mongoose.connection.close().catch(() => {});
    }
    jest.resetModules();
    delete (global as typeof globalThis & { mongoose?: unknown }).mongoose;
  });

  afterAll(async () => {
    const mongoose = await getMongoose();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close().catch(() => {});
    }
    await mongo.stop();
    process.env = { ...ORIGINAL_ENV };
    delete (global as typeof globalThis & { mongoose?: unknown }).mongoose;
  });

  it('connects to an in-memory server and reuses the connection', async () => {
    const dbConnect = await loadDbConnect();

    const first = await dbConnect();
    const second = await dbConnect();
    const mongoose = await getMongoose();

    expect(mongoose.connection.readyState).toBe(1);
    expect(second.connection).toBe(first.connection);
  });

  it('deduplicates concurrent calls against mongodb-memory-server', async () => {
    const dbConnect = await loadDbConnect();

    const [first, second, third] = await Promise.all([dbConnect(), dbConnect(), dbConnect()]);

    expect(first.connection).toBe(second.connection);
    expect(second.connection).toBe(third.connection);
  });
});