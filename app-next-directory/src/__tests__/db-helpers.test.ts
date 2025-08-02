// Jest test for db-helpers.ts

// Create different mock scenarios based on test context
let mockClientPromise: any = undefined;
let mockClientBehavior = 'normal';

jest.mock('mongodb', () => {
  class MockMongoClient {
    connect() {
      if (mockClientBehavior === 'invalid-client') {
        return Promise.resolve(null);
      }
      if (mockClientBehavior === 'no-db-function') {
        return Promise.resolve({});
      }
      if (mockClientBehavior === 'invalid-db') {
        return Promise.resolve({
          db: () => null
        });
      }
      if (mockClientBehavior === 'no-collection-function') {
        return Promise.resolve({
          db: () => ({})
        });
      }
      return Promise.resolve(this);
    }
    db(name?: string) {
      return {
        collection: jest.fn().mockReturnValue('mockCollection'),
      };
    }
  }
  return {
    MongoClient: MockMongoClient,
    default: MockMongoClient,
  };
});

describe('db-helpers', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockClientBehavior = 'normal';
    process.env = { ...OLD_ENV, MONGODB_URI: 'mongodb://test', NODE_ENV: 'test' };
    // Clear the global variable
    delete (global as any)._mongoClientPromise;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('throws if MONGODB_URI is missing', () => {
    jest.resetModules();
    delete (global as any)._mongoClientPromise;
    // Remove the module from require cache
    const modulePath = require.resolve('../utils/db-helpers');
    if (require.cache[modulePath]) {
      delete require.cache[modulePath];
    }
    process.env.MONGODB_URI = '';
    expect(() => require('../utils/db-helpers')).toThrow('MongoDB URI is missing. Please set the MONGODB_URI environment variable.');
  });

  it('returns a database instance', async () => {
    const { getDatabase } = require('../utils/db-helpers');
    const db = await getDatabase();
    expect(db.collection).toBeDefined();
  });

  it('returns a collection instance', async () => {
    const { getCollection } = require('../utils/db-helpers');
    const collection = await getCollection('test');
    expect(collection).toBe('mockCollection');
  });

  it('throws on invalid collection name', async () => {
    const { getCollection } = require('../utils/db-helpers');
    await expect(getCollection('')).rejects.toThrow(/Invalid collection name/);
    await expect(getCollection(null as any)).rejects.toThrow(/Invalid collection name/);
    await expect(getCollection('invalid!name')).rejects.toThrow(/Invalid collection name/);
  });

  it('accepts valid collection names with dash and underscore', async () => {
    const { getCollection } = require('../utils/db-helpers');
    const result1 = await getCollection('test-collection');
    expect(result1).toBe('mockCollection');
    const result2 = await getCollection('test_collection');
    expect(result2).toBe('mockCollection');
  });

  it('validates collection name with special characters', async () => {
    const { getCollection } = require('../utils/db-helpers');
    
    // Test various invalid collection names
    await expect(getCollection('collection with spaces')).rejects.toThrow(/Invalid collection name/);
    await expect(getCollection('collection@invalid')).rejects.toThrow(/Invalid collection name/);
    await expect(getCollection('collection$invalid')).rejects.toThrow(/Invalid collection name/);
    await expect(getCollection('collection/invalid')).rejects.toThrow(/Invalid collection name/);
  });

  it('validates collection name with non-string inputs', async () => {
    const { getCollection } = require('../utils/db-helpers');
    
    await expect(getCollection(123 as any)).rejects.toThrow(/Invalid collection name/);
    await expect(getCollection({} as any)).rejects.toThrow(/Invalid collection name/);
    await expect(getCollection([] as any)).rejects.toThrow(/Invalid collection name/);
    await expect(getCollection(undefined as any)).rejects.toThrow(/Invalid collection name/);
  });

  it('handles database name correctly', async () => {
    const { getDatabase } = require('../utils/db-helpers');
    const db = await getDatabase();
    
    // The mock should return an object with collection method
    expect(typeof db.collection).toBe('function');
  });

  it('handles browser environment correctly', () => {
    // Save the original window value
    const originalWindow = global.window;
    
    // Mock browser environment
    (global as any).window = {};
    
    jest.resetModules();
    delete (global as any)._mongoClientPromise;
    process.env.MONGODB_URI = 'mongodb://test';
    
    // Requiring the module in browser environment should work
    expect(() => require('../utils/db-helpers')).not.toThrow();
    
    // Restore original window value
    if (originalWindow === undefined) {
      delete (global as any).window;
    } else {
      global.window = originalWindow;
    }
  });

  it('handles server environment initialization', () => {
    // This test verifies that the module loads correctly in server environment
    // The initialization logic is tested indirectly through other tests
    expect(typeof require('../utils/db-helpers').getDatabase).toBe('function');
    expect(typeof require('../utils/db-helpers').getCollection).toBe('function');
  });

  it('handles invalid client from clientPromise', async () => {
    mockClientBehavior = 'invalid-client';
    jest.resetModules();
    const { getDatabase } = require('../utils/db-helpers');
    await expect(getDatabase()).rejects.toThrow('MongoDB client is invalid or not connected');
  });

  it('handles client without db function', async () => {
    mockClientBehavior = 'no-db-function';
    jest.resetModules();
    const { getDatabase } = require('../utils/db-helpers');
    await expect(getDatabase()).rejects.toThrow('MongoDB client is invalid or not connected');
  });

  it('handles invalid db instance in getCollection', async () => {
    mockClientBehavior = 'invalid-db';
    jest.resetModules();
    const { getCollection } = require('../utils/db-helpers');
    await expect(getCollection('test')).rejects.toThrow('Database instance is invalid');
  });

  it('handles db instance without collection function', async () => {
    mockClientBehavior = 'no-collection-function';
    jest.resetModules();
    const { getCollection } = require('../utils/db-helpers');
    await expect(getCollection('test')).rejects.toThrow('Database instance is invalid');
  });
});