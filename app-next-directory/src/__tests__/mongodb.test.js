// Jest test for mongodb.js

describe('mongodb.js', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
    global._mongoClientPromise = undefined;
  });

  it('throws if MONGODB_URI is missing', () => {
    process.env.MONGODB_URI = '';
    expect(() => {
      jest.requireActual('../lib/mongodb.js');
    }).toThrow(/Mongo URI/);
  });

  it('returns a promise in development', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.NODE_ENV = 'development';
    global._mongoClientPromise = undefined;
    const mockClient = { connect: jest.fn().mockResolvedValue({}) };
    jest.mock('mongodb', () => ({
      MongoClient: jest.fn(() => mockClient),
    }));
    const mod = jest.requireActual('../lib/mongodb.js');
    expect(mod.default).toBeDefined();
  });

  it('throws on malformed URI', () => {
    process.env.MONGODB_URI = 'not-a-uri';
    expect(() => {
      jest.requireActual('../lib/mongodb.js');
    }).toThrow(/valid Mongo URI/);
  });

  it('throws if clientPromise is not created', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.NODE_ENV = 'development';
    // Simulate error in MongoClient constructor
    jest.mock('mongodb', () => {
      throw new Error('fail');
    });
    expect(() => {
      jest.requireActual('../lib/mongodb.js');
    }).toThrow(/fail/);
  });

  it('returns a promise in production', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.NODE_ENV = 'production';
    const mockClient = { connect: jest.fn().mockResolvedValue({}) };
    jest.mock('mongodb', () => ({
      MongoClient: jest.fn(() => mockClient),
    }));
    const mod = jest.requireActual('../lib/mongodb.js');
    expect(mod.default).toBeDefined();
  });

  it('reuses global variable in development', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.NODE_ENV = 'development';
    global._mongoClientPromise = Promise.resolve('cached');
    const mod = jest.requireActual('../lib/mongodb.js');
    expect(mod.default).toBe(global._mongoClientPromise);
  });
});