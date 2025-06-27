// db-helpers.test.ts
import { getDatabase, getCollection } from '../db-helpers';

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
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('throws if MONGODB_URI is missing', () => {
    process.env.MONGODB_URI = '';
    expect(() => require('../db-helpers')).toThrow('Please add your MongoDB URI to .env.local');
  });

  it('returns a db instance', async () => {
    const db = await getDatabase();
    expect(db.collection).toBeDefined();
  });

  it('returns a collection instance', async () => {
    const collection = await getCollection('test');
    expect(collection).toBe('mockCollection');
  });
});