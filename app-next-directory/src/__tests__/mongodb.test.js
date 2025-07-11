// Jest test for mongodb.js

// Polyfill TextEncoder for Node.js/Jest environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder } = require('util');
  global.TextEncoder = TextEncoder;
}

// Polyfill TextDecoder for Node.js/Jest environment
if (typeof global.TextDecoder === 'undefined') {
  const { TextDecoder } = require('util');
  global.TextDecoder = TextDecoder;
}

describe('mongodb.js', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    global._mongoClientPromise = undefined;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = OLD_ENV;
    global._mongoClientPromise = undefined;
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('throws if MONGODB_URI is missing', async () => {
    process.env.MONGODB_URI = '';
    jest.resetModules();
    await expect(async () => {
      await import('../lib/mongodb.js');
    }).rejects.toThrow(/Mongo URI/);
  });

  it('returns a promise in development', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.NODE_ENV = 'development';
    global._mongoClientPromise = undefined;
    jest.resetModules();
    jest.doMock('mongodb', () => {
      return {
        MongoClient: jest.fn(() => ({
          connect: jest.fn().mockResolvedValue({}),
        })),
      };
    });
    const mod = require('../lib/mongodb.js');
    expect(mod.default).toBeDefined();
    jest.dontMock('mongodb');
  });

  it('throws on malformed URI', () => {
    process.env.MONGODB_URI = 'not-a-uri';
    jest.resetModules();
    expect(() => {
      require('../lib/mongodb.js');
    }).toThrow(/valid Mongo URI/);
  });

  it('throws if clientPromise is not created', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    jest.doMock('mongodb', () => {
      throw new Error('fail');
    });
    expect(() => {
      require('../lib/mongodb.js');
    }).toThrow(/fail/);
    jest.dontMock('mongodb');
  });

  it('returns a promise in production', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    jest.doMock('mongodb', () => {
      return {
        MongoClient: jest.fn(() => ({
          connect: jest.fn().mockResolvedValue({}),
        })),
      };
    });
    const mod = require('../lib/mongodb.js');
    expect(mod.default).toBeDefined();
    jest.dontMock('mongodb');
  });

  it('reuses global variable in development', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.NODE_ENV = 'development';
    global._mongoClientPromise = Promise.resolve('cached');
    jest.resetModules();
    const mod = require('../lib/mongodb.js');
    expect(mod.default).toBe(global._mongoClientPromise);
  });
});