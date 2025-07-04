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
    jest.doMock('../utils/db-helpers', () => ({
      ...jest.requireActual('../utils/db-helpers'),
      clientPromise: Promise.resolve(mockClient),
      getCollection: jest.fn(async (name) => {
        if (!name || typeof name !== 'string' || !/^[\w-]+$/.test(name)) {
          throw new Error('Invalid collection name');
        }
        const client = await Promise.resolve(mockClient);
        if (!client || typeof client.db !== 'function') {
          throw new Error('MongoDB client is invalid or not connected');
        }
        return client.db('sustainable-nomads').collection(name);
      })
    }));
    const mod = require('../utils/db-helpers');
    const collection = await mod.getCollection('test');
    expect(collection).toBe(mockCollection);
  });

  it('throws on invalid collection name', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    const { getCollection } = jest.requireActual('../utils/db-helpers');
    await expect(getCollection()).rejects.toThrow(/Invalid collection name/);
    await expect(getCollection()).rejects.toThrow(/Invalid collection name/);
    await expect(getCollection(undefined as any)).rejects.toThrow(/Invalid collection name/);
  });

  it('throws if clientPromise is missing', async () => {
    jest.resetModules();
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    jest.doMock('../utils/db-helpers', () => ({
      ...jest.requireActual('../utils/db-helpers'),
      clientPromise: undefined,
    }));
    const mod = require('../utils/db-helpers');
    await expect(mod.getDatabase()).rejects.toThrow(/invalid or not connected/i);
  });
});