/** @jest-environment node */
import { describe, beforeAll, afterAll, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import { createMongoMemoryServer } from '../../test-helpers/createMongoMemoryServer';

const ORIGINAL_ENV = { ...process.env };

const loadDbConnect = async () => {
  const dbModule = await import('../dbConnect');
  return dbModule.default;
};

const getMongoose = async () => {
  const mod = await import('mongoose');
  return mod.default ?? (mod as unknown as typeof import('mongoose'));
};

jest.setTimeout(60000);

describe('dbConnect (integration)', () => {
  let mongo: MongoMemoryServer | null = null;

  beforeAll(async () => {
    mongo = await createMongoMemoryServer();
    process.env.MONGODB_URI = mongo.getUri();
  });

  beforeEach(() => {
    jest.resetModules();
    delete (global as typeof globalThis & { mongoose?: unknown }).mongoose;
    if (!mongo) {
      throw new Error('MongoMemoryServer instance is not initialised');
    }
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
    if (mongo) {
      await mongo.stop();
    }
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