import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const ORIGINAL_ENV = { ...process.env };

const mongoConnectMock = jest.fn(async (client: unknown) => client);
const mongoInstances: Array<{ uri?: string; options?: unknown }> = [];

class MockMongoClient {
  uri?: string;
  options?: unknown;
  constructor(uri?: string, options?: unknown) {
    this.uri = uri;
    this.options = options;
    mongoInstances.push(this);
  }
  connect() {
    return mongoConnectMock(this);
  }
}

const initializeDatabaseMock = jest.fn();

jest.mock('../mongodb/init', () => ({ initializeDatabase: initializeDatabaseMock }));
jest.mock('mongodb', () => ({ MongoClient: MockMongoClient }));

const resetEnv = () => {
  process.env = { ...ORIGINAL_ENV };
};

const clearMongoGlobals = () => {
  delete (global as typeof globalThis & { _mongoClientPromise?: unknown })._mongoClientPromise;
};

describe('mongodb.ts (TypeScript client)', () => {
  beforeEach(() => {
    jest.resetModules();
    resetEnv();
    clearMongoGlobals();
    initializeDatabaseMock.mockReset();
    mongoConnectMock.mockReset();
    mongoConnectMock.mockImplementation(async (client) => client);
    mongoInstances.length = 0;
  });

  afterEach(() => {
    resetEnv();
    clearMongoGlobals();
  });

  it('returns a mocked client when NODE_ENV is test', async () => {
    process.env.NODE_ENV = 'test';

    const mod = await import('../mongodb');
    const client = await mod.default;

    expect(typeof client.db).toBe('function');
    expect(mongoConnectMock).not.toHaveBeenCalled();
    expect(initializeDatabaseMock).not.toHaveBeenCalled();
  });

  it('connects once in development and caches the promise', async () => {
    process.env.NODE_ENV = 'development';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';

    const mod = await import('../mongodb');
    const first = await mod.default;
    const second = await mod.default;

    expect(mongoConnectMock).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(mongoInstances[0]?.uri).toBe('mongodb://localhost:27017/test-db');
  });

  it('throws a helpful error when MONGODB_URI is missing outside of test env', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.MONGODB_URI;

    await expect(import('../mongodb')).rejects.toThrow(/Mongo URI/);
  });
});
