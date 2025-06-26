// Jest unit tests for dbConnect.ts

import dbConnect from '../dbConnect';

jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

const mongoose = require('mongoose');

describe('dbConnect', () => {
  let originalEnv: any;
  let originalGlobal: any;

  beforeEach(() => {
    originalEnv = process.env.MONGODB_URI;
    process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
    originalGlobal = { ...global };
    // Reset global cache
    global.mongoose = { conn: null, promise: null };
    jest.clearAllMocks();
    jest.resetModules();
  });

  afterEach(() => {
    process.env.MONGODB_URI = originalEnv;
    global.mongoose = originalGlobal.mongoose;
    jest.resetModules();
  });

  it('throws if MONGODB_URI is not set', async () => {
    process.env.MONGODB_URI = '';
    jest.resetModules();
    expect(() => {
      require('../dbConnect').default;
    }).toThrow(/MONGODB_URI/);
  });

  it('returns cached connection if present', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
    jest.resetModules();
    const dbConnect = require('../dbConnect').default;
    const fakeConn = { readyState: 1 };
    // Cast as any to satisfy type checker for test mocking
    global.mongoose.conn = fakeConn as any;
    const result = await dbConnect();
    expect(result).toBe(fakeConn);
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  it('establishes new connection if not cached', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
    jest.resetModules();
    const dbConnect = require('../dbConnect').default;
    const fakeConn = { readyState: 1 };
    (mongoose.connect as jest.Mock).mockResolvedValue(fakeConn);
    const result = await dbConnect();
    expect(result).toBe(fakeConn);
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
    const dbConnect = require('../dbConnect').default;
    (mongoose.connect as jest.Mock).mockRejectedValue(new Error('fail'));
    await expect(dbConnect()).rejects.toThrow('fail');
    expect(global.mongoose.promise).toBeNull();
  });
});
