// db-helpers.test.ts

jest.mock('mongodb', () => {
  const mDb = { collection: jest.fn().mockReturnValue('mockCollection') };
  const mClient = { db: jest.fn().mockReturnValue(mDb), connect: jest.fn().mockResolvedValue({ db: () => mDb }) };
  return { MongoClient: jest.fn(() => mClient) };
});

describe('db-helpers', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, MONGODB_URI: 'mongodb://test', NODE_ENV: 'test' };
    // Mock db-helpers for tests that need it
    jest.doMock('../db-helpers', () => ({
      getDatabase: jest.fn().mockResolvedValue({ collection: jest.fn() }),
      getCollection: jest.fn().mockResolvedValue('mockCollection'),
    }));
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('throws if MONGODB_URI is missing', () => {
    jest.isolateModules(() => {
      // Ensure db-helpers is not mocked for this specific test
      jest.unmock('../db-helpers');
      process.env.MONGODB_URI = '';
      expect(() => require('../db-helpers')).toThrow('Please add your MongoDB URI to .env.local');
    });
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
});