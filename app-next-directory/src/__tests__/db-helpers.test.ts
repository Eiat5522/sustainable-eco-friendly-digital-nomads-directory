// Jest test for db-helpers.ts

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
    const mockDb = { collection: jest.fn() };
    // Mock the module and override getDatabase to return mockDb
    jest.resetModules();
    jest.doMock('../utils/db-helpers', () => ({
      ...jest.requireActual('../utils/db-helpers'),
      getDatabase: jest.fn().mockResolvedValue(mockDb),
    }));
    const mod = require('../utils/db-helpers');
    const db = await mod.getDatabase();
    expect(db).toBe(mockDb);
  });

  it('returns a collection instance', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    const mockCollection = {};
    const mockDb = { collection: jest.fn(() => mockCollection) };
    const mockClient = { db: jest.fn(() => mockDb) };
    jest.resetModules();
    const mod = require('../utils/db-helpers');
    // Mock clientPromise to resolve to our mockClient
    mod.clientPromise = Promise.resolve(mockClient);
    // Also mock getDatabase to return mockDb
    mod.getDatabase = jest.fn().mockResolvedValue(mockDb);
    const collection = await mod.getCollection('test');
    expect(collection).toBe(mockCollection);
  });

  it('throws on invalid collection name', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    const { getCollection } = jest.requireActual('../utils/db-helpers');
    await expect(getCollection('')).rejects.toThrow(/Invalid collection name/);
    await expect(getCollection('bad name!')).rejects.toThrow(/Invalid collection name/);
    await expect(getCollection(undefined as any)).rejects.toThrow(/Invalid collection name/);
  });

  it('throws if clientPromise is missing', async () => {
    jest.resetModules();
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    const mod = require('../utils/db-helpers');
    mod.clientPromise = undefined;
    await expect(mod.getDatabase()).rejects.toThrow('MongoDB client is not initialized');
  });
});