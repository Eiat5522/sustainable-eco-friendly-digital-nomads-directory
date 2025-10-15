import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

const ORIGINAL_ENV = { ...process.env };

const mongoClientConnectMock = jest.fn();
const mongoClientInstances: Array<{ uri?: string; options?: unknown }> = [];

class MockMongoClient {
  uri?: string;
  options?: unknown;
  connect = mongoClientConnectMock;
  constructor(uri?: string, options?: unknown) {
    this.uri = uri;
    this.options = options;
    mongoClientInstances.push(this);
  }
}

jest.mock('mongodb', () => ({ MongoClient: MockMongoClient }));

const reset = () => {
  process.env = { ...ORIGINAL_ENV };
  mongoClientConnectMock.mockReset();
  mongoClientInstances.length = 0;
  delete (global as typeof globalThis & { _mongoClientPromise?: unknown })._mongoClientPromise;
};

describe('mongodb.js (legacy client)', () => {
  beforeEach(() => {
    jest.resetModules();
    reset();
  });

  afterEach(() => {
    reset();
  });

  it('short-circuits to a mock client during tests', async () => {
    process.env.NODE_ENV = 'test';

    const mod = await import('../mongodb.js');
    const client = await mod.default;

    const db = await client.db();
    const collection = await db.collection('users');

    expect(typeof db.createCollection).toBe('function');
    expect(await collection.insertOne({})).toEqual({ insertedId: 'mock' });
    expect(mongoClientConnectMock).not.toHaveBeenCalled();
  });

  it('throws when MONGODB_URI is missing outside the test environment', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.MONGODB_URI;

    await expect(import('../mongodb.js')).rejects.toThrow('Please add a valid Mongo URI');
  });

  it('creates a single MongoClient in development and reuses the promise', async () => {
    process.env.NODE_ENV = 'development';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/mydb';

    const resolvedClient = { ready: true };
    mongoClientConnectMock.mockResolvedValue(resolvedClient);

    const mod = await import('../mongodb.js');
    const first = await mod.default;
    const second = await mod.default;

    expect(mongoClientConnectMock).toHaveBeenCalledTimes(1);
    expect(first).toBe(resolvedClient);
    expect(second).toBe(resolvedClient);
    expect(mongoClientInstances[0]?.uri).toBe('mongodb://localhost:27017/mydb');
  });
});
