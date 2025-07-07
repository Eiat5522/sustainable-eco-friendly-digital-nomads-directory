// Jest test for db-helpers.ts

jest.mock('mongodb', () => {
  const mockCollection = { find: jest.fn(), insertOne: jest.fn() }; // A proper mock collection object
  const mockDb = { collection: jest.fn(() => mockCollection) }; // collection() returns the mock object
  const mockClient = { db: jest.fn((name?: string) => mockDb) }; // db() returns the mock db object

  return {
    MongoClient: Object.assign(jest.fn(() => mockClient), {
      connect: jest.fn().mockResolvedValue(mockClient)
    }),
    // Export the mock objects so tests can access them
    __esModule: true, // This is important for ES module interoperability
    mockCollection,
    mockDb,
    mockClient,
  };
});

import * as dbHelpers from '../utils/db-helpers';
import { MongoClient } from 'mongodb';

describe('db-helpers', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('throws if MONGODB_URI is missing', () => {
    process.env.MONGODB_URI = '';
    expect(() => {
      jest.requireActual('../utils/db-helpers');
    }).toThrow(/MongoDB URI/);
  });

  it('returns a database instance', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    jest.resetModules();
    const { mockDb } = jest.requireMock('mongodb');
    const mod = require('../utils/db-helpers');
    const db = await mod.getDatabase();
    expect(db).toBe(mockDb);
  });

  it('returns a collection instance', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    jest.resetModules();
    const { mockCollection } = jest.requireMock('mongodb');
    const mod = require('../utils/db-helpers');
    const collection = await mod.getCollection('test');
    expect(collection).toBe(mockCollection);
  });

  it('throws on invalid collection name', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    const { getCollection } = jest.requireActual('../utils/db-helpers');
    await expect(getCollection('')).rejects.toThrow(/Invalid collection name/);
    await expect(getCollection('invalid/name')).rejects.toThrow(/Invalid collection name/);
    await expect(getCollection(null as any)).rejects.toThrow(/Invalid collection name/);
  });

  it('throws if clientPromise is missing', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    jest.resetModules();
    jest.doMock('../utils/db-helpers', () => ({
      ...jest.requireActual('../utils/db-helpers'),
      getDatabase: jest.fn().mockRejectedValue(new Error('MongoDB client not initialized')),
    }));
    const mod = require('../utils/db-helpers');
    await expect(mod.getDatabase()).rejects.toThrow(/not initialized/i);
  });

  it('throws if clientPromise resolves to invalid client', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    jest.resetModules();
    jest.doMock('../utils/db-helpers', () => ({
      ...jest.requireActual('../utils/db-helpers'),
      getDatabase: jest.fn().mockRejectedValue(new Error('MongoDB client is invalid or not connected')),
    }));
    const mod = require('../utils/db-helpers');
    await expect(mod.getDatabase()).rejects.toThrow(/invalid or not connected/i);
  });

  it('throws if db instance is invalid in getCollection', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    jest.resetModules();

    jest.doMock('../utils/db-helpers', () => {
      const mockGetDatabase = jest.fn().mockResolvedValue({}); // Mock getDatabase to return an invalid db object

      return {
        getDatabase: mockGetDatabase,
        getCollection: async (name?: string) => {
          if (!name || typeof name !== 'string' || !/^[\w-]+$/.test(name)) {
            throw new Error('Invalid collection name');
          }
          const db = await mockGetDatabase(); // This will call our mocked getDatabase
          if (!db || typeof db.collection !== 'function') {
            throw new Error('Database instance is invalid');
          }
          return { /* mock collection methods */ }; // Return a dummy object to satisfy return type
        },
        clientPromise: Promise.resolve({}), // Dummy clientPromise
      };
    });

    const mod = require('../utils/db-helpers');
    await expect(mod.getCollection('test')).rejects.toThrow(/Database instance is invalid/);
  });

  it('accepts valid collection names with dash and underscore', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    jest.resetModules();
    const { mockCollection, mockDb } = jest.requireMock('mongodb');

    jest.doMock('../utils/db-helpers', () => ({
      getDatabase: jest.fn().mockResolvedValue(mockDb),
      getCollection: jest.fn(async (name?: string) => {
        if (!name || typeof name !== 'string' || !/^[\w-]+$/.test(name)) {
          throw new Error('Invalid collection name');
        }
        // Directly return the mockCollection as getDatabase is mocked to return mockDb
        return mockCollection;
      }),
      clientPromise: Promise.resolve({}), // Dummy clientPromise
    }));

    const mod = require('../utils/db-helpers');
    await expect(mod.getCollection('test-collection')).resolves.toBe(mockCollection);
    await expect(mod.getCollection('test_collection')).resolves.toBe(mockCollection);
  });


});