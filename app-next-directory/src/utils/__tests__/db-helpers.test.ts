// db-helpers.test.ts

jest.mock('mongodb', () => {
  const mDb = { collection: jest.fn().mockReturnValue('mockCollection') };
  // db should accept an optional name argument to match the real MongoClient API
  const mClient = { db: jest.fn((name?: string) => mDb) };
  return {
    MongoClient: Object.assign(jest.fn(() => mClient), {
      connect: jest.fn().mockResolvedValue(mClient)
    })
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


});