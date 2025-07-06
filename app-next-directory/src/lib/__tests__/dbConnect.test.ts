/**
 * Jest unit tests for dbConnect.ts
 * Ensures mongoose is mocked before dbConnect is imported in each test.
 */

// Extend NodeJS global type for test-specific mongoose cache
// Match the app's global.mongoose type for test compatibility
type MongooseCache = {
  conn: any | null;
  promise: Promise<any> | null;
};
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}
jest.mock('mongoose', () => {
  const connect = jest.fn().mockImplementation(() => Promise.resolve({ readyState: 1 }));
  return {
    connect,
    default: { connect }, // Provide a default export as well
  };
});

/* Use import type to avoid redeclaration error */
import type mongooseType from 'mongoose';
let mongoose: typeof mongooseType;

describe('dbConnect', () => {
  let originalEnv: any;
  let originalGlobal: any;

  beforeEach(() => {
    jest.resetModules();
    mongoose = require('mongoose');
    originalEnv = process.env.MONGODB_URI;
    process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
    originalGlobal = { ...global };
    // Reset global cache
    global.mongoose = { conn: null, promise: null };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.MONGODB_URI = originalEnv;
    global.mongoose = originalGlobal.mongoose;
    jest.resetModules();
  });

  it('throws if MONGODB_URI is not set', () => {
    process.env.MONGODB_URI = '';
    jest.resetModules();
    expect(() => {
      require('../dbConnect'); // Importing the module triggers the error
    }).toThrow(/MONGODB_URI/);
  });

  it('returns cached connection if present', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
    jest.resetModules();
    mongoose = require('mongoose');
    const dbConnect = require('../dbConnect').default;
    const fakeConn = { readyState: 1 };
    global.mongoose.conn = fakeConn as any;
    const result = await dbConnect();
    expect(result).toBe(fakeConn);
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  it('establishes new connection if not cached', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
    jest.resetModules();
    mongoose = require('mongoose');
    const dbConnect = require('../dbConnect').default;
    const fakeConn = { readyState: 1 };
    (mongoose.connect as jest.Mock).mockResolvedValue(fakeConn);
    const result = await dbConnect();
    expect(result).toStrictEqual(fakeConn);
    expect(mongoose.connect).toHaveBeenCalledWith(
      'mongodb://localhost:27017/testdb',
      expect.objectContaining({ bufferCommands: false })
    );
    // Should cache the connection
    expect(global.mongoose.conn).toBe(fakeConn);
  });

  it('resets promise and throws on connection error', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
    jest.resetModules();
    mongoose = require('mongoose');
    const dbConnect = require('../dbConnect').default;
    (mongoose.connect as jest.Mock).mockRejectedValue(new Error('fail'));
    // Initialize promise to simulate in-progress connection
    global.mongoose.promise = Promise.reject(new Error('fail'));
    // Suppress unhandled rejection warning for this test
    global.mongoose.promise.catch(() => {});
    await expect(dbConnect()).rejects.toThrow('fail');
    expect(global.mongoose.promise).toBeNull();
  });
});
