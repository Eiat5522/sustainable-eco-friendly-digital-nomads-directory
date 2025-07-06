/**
 * Jest unit tests for dbConnect.ts
 * Ensures mongoose is mocked before dbConnect is imported in each test.
 */

// Extend NodeJS global type for test-specific mongoose cache
// Match the app's global.mongoose type for test compatibility




describe('dbConnect', () => {
  let originalEnv: any;
  let originalGlobal: any;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('mongoose', () => ({
      connect: jest.fn().mockImplementation(() => Promise.resolve({ readyState: 1 })),
      default: { connect: jest.fn().mockImplementation(() => Promise.resolve({ readyState: 1 })) },
    }), { virtual: true });
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
    jest.dontMock('mongoose');
  });

  it('throws if MONGODB_URI is not set', async () => {
    process.env.MONGODB_URI = '';
    jest.resetModules();
    const dbConnect = require('../dbConnect').default;
    await expect(dbConnect()).rejects.toThrow(/Invalid or missing MONGODB_URI/);
  });

  it('returns cached connection if present', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
    jest.resetModules();
    const mongoose = require('mongoose');
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
    const mongoose = require('mongoose');
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
    const mongoose = require('mongoose');
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
