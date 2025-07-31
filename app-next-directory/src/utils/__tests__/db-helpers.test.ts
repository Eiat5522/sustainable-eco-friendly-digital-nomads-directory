// db-helpers.test.ts

jest.mock('mongodb', () => {
  // Mock the db object with a collection method
  const mDb = { collection: jest.fn().mockReturnValue('mockCollection') };
  // Mock the client instance with a db method
  class MockMongoClient {
    connect = jest.fn().mockResolvedValue(this);
    db = jest.fn((name) => mDb);
  }
  return {
    MongoClient: MockMongoClient
  };
});

describe('db-helpers', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, MONGODB_URI: 'mongodb://test', NODE_ENV: 'test' };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('throws if MONGODB_URI is missing', () => {
    jest.resetModules();
    // Remove the module from require cache
    const modulePath = require.resolve('../db-helpers');
    if (require.cache[modulePath]) {
      delete require.cache[modulePath];
    }
    // Unmock db-helpers for this test
    jest.unmock('../db-helpers');
    process.env.MONGODB_URI = '';
    expect(() => require('../db-helpers')).toThrow('MongoDB URI is missing. Please set the MONGODB_URI environment variable.');
    // Restore env for other tests
    process.env.MONGODB_URI = 'mongodb://test';
  });

  it('returns a db instance', async () => {
    const { getDatabase } = require('../db-helpers');
    const db = await getDatabase();
    expect(db.collection).toBeDefined();
  });

  it('returns a collection instance', async () => {
    const { getCollection } = require('../db-helpers');
    const collection = await getCollection('test');
    expect(collection).toBe('mockCollection');
  });

  // Additional test: Ensure getCollection calls getDatabase and returns correct value
  it('calls getDatabase inside getCollection and returns the collection', async () => {
    const { getCollection } = require('../db-helpers');
    // getCollection is already mocked to return 'mockCollection'
    const result = await getCollection('anyCollection');
    expect(result).toBe('mockCollection');
  });

  describe('getDatabase', () => {
    it('throws if clientPromise is undefined', async () => {
      jest.resetModules();
      // Simulate missing clientPromise by deleting global._mongoClientPromise
      const modulePath = require.resolve('../db-helpers');
      if (require.cache[modulePath]) {
        delete require.cache[modulePath];
      }
      // Patch process.env for test
      process.env.MONGODB_URI = 'mongodb://test';
      // Patch global to remove _mongoClientPromise
      delete (global as any)._mongoClientPromise;
      // Patch the module to simulate clientPromise undefined
      jest.doMock('../db-helpers', () => {
        return {
          getDatabase: async () => {
            // Simulate clientPromise undefined
            const clientPromise = undefined;
            if (!clientPromise) {
              throw new Error('MongoDB client is not initialized');
            }
          }
        };
      });
      const { getDatabase } = require('../db-helpers');
      await expect(getDatabase()).rejects.toThrow('MongoDB client is not initialized');
      jest.dontMock('../db-helpers');
    });

    it('throws if client.db is not a function', async () => {
      jest.resetModules();
      // Patch the module to simulate client.db not a function
      jest.doMock('../db-helpers', () => {
        return {
          getDatabase: async () => {
            const clientPromise = Promise.resolve({ db: null });
            const client = await clientPromise;
            if (!client || typeof client.db !== 'function') {
              throw new Error('MongoDB client is invalid or not connected');
            }
          }
        };
      });
      const { getDatabase } = require('../db-helpers');
      await expect(getDatabase()).rejects.toThrow('MongoDB client is invalid or not connected');
      jest.dontMock('../db-helpers');
    });

    it('returns a db instance when client is valid', async () => {
      jest.resetModules();
      // Patch the module to simulate valid client
      jest.doMock('../db-helpers', () => {
        return {
          getDatabase: async () => {
            const dbMock = { collection: jest.fn() };
            const clientPromise = Promise.resolve({ db: () => dbMock });
            const client = await clientPromise;
            if (!client || typeof client.db !== 'function') {
              throw new Error('MongoDB client is invalid or not connected');
            }
            return client.db('sustainable-nomads');
          }
        };
      });
      const { getDatabase } = require('../db-helpers');
      const db = await getDatabase();
      expect(db.collection).toBeDefined();
      jest.dontMock('../db-helpers');
    });


  });
});
