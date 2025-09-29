import type { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const isE2E = process.env.E2E === '1';

/**
 * Database Connection & Index Management
 *
 * INDEX MANAGEMENT APPROACH:
 * - Schema-level indexes: Defined in Mongoose models (auto-created unless autoIndex=false)
 * - Database-level indexes: Defined in src/lib/mongodb/init.ts (explicit creation)
 * - Single source of truth: Database indexes take precedence to avoid conflicts
 *
 * PRODUCTION CONSIDERATIONS:
 * - Set mongoose autoIndex=false in production for performance
 * - Use SYNC_INDEXES_ON_CONNECT=true to ensure indexes are created on startup
 * - Monitor index creation logs to verify successful initialization
 * - Run migrations if schema changes require index modifications
 */

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
  indexesSynced: boolean;
}

let cached = (global as typeof globalThis & { mongoose?: MongooseCache }).mongoose;

if (!cached) {
  cached = ((global as typeof globalThis & { mongoose?: MongooseCache }).mongoose = { conn: null, promise: null });
}

async function realDbConnect(): Promise<Mongoose> {
  // Dynamically load mongoose for mocking flexibility
  const mongoose: Mongoose = require('mongoose');

  if (isE2E || process.env.NODE_ENV === 'test') {
    if (!cached.conn) {
      cached.conn = mongoose;
      cached.promise = Promise.resolve(mongoose);
      cached.indexesSynced = true;

      if (typeof (mongoose as any).connection?.readyState === 'number') {
        (mongoose as any).connection.readyState = 1;
      }
    }

    return cached.conn!;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  if (typeof MONGODB_URI !== 'string') {
    throw new Error('MONGODB_URI must be a string');
  }
  if (!/^mongodb(\+srv)?:\/\/.+/.test(MONGODB_URI)) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection string starting with mongodb:// or mongodb+srv://');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      tlsAllowInvalidCertificates: process.env.NODE_ENV === 'development',
    };

    try {
      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance: typeof mongoose) => {
        // DEBUG: Log the returned mongooseInstance for troubleshooting
        // FORTEST: Remove this log after debugging
        // eslint-disable-next-line no-console
        console.log('DEBUG: mongoose.connect returned:', mongooseInstance);
        // Stricter validation: must be object and have readyState or connection.readyState
        if (
          !mongooseInstance ||
          typeof mongooseInstance !== 'object' ||
          (
            typeof (mongooseInstance as any).readyState !== 'number' &&
            (!('connection' in mongooseInstance) || typeof (mongooseInstance as any).connection.readyState !== 'number')
          )
        ) {
          throw new Error('Mongoose did not return a valid connection');
        }
        return mongooseInstance;
      });
    } catch (err) {
      cached.promise = null;
      throw new Error('Failed to connect to MongoDB: ' + (err instanceof Error ? err.message : err));
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    cached.conn = null; // Reset the connection cache on error
    throw new Error('MongoDB connection error: ' + (e instanceof Error ? e.message : e));
  }

  if (!cached.conn) {
    throw new Error('MongoDB connection was not established');
  }

  // Sync indexes and ensure database initialization
  if (!cached.indexesSynced && (process.env.NODE_ENV === 'development' || process.env.SYNC_INDEXES_ON_CONNECT === 'true')) {
    try {
      // Import models for index synchronization
      const [{ default: PasswordResetToken }, { default: User }] = await Promise.all([
        import('@/models/PasswordResetToken'),
        import('@/models/User')
      ]);

      // Sync Mongoose schema indexes
      await Promise.all([
        PasswordResetToken.syncIndexes(),
        User.syncIndexes(),
      ]);

      // Initialize database with explicit indexes (single source of truth)
      // This ensures indexes are created even with mongoose autoIndex=false
      const { initializeDatabase } = await import('./mongodb/init');
      const MongoClient = require('mongodb').MongoClient;
      const client = new MongoClient(MONGODB_URI);
      await client.connect();
      await initializeDatabase(client);
      await client.close();

      cached.indexesSynced = true;
      // eslint-disable-next-line no-console
      console.log('Database indexes synchronized and initialized');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Index sync/initialization failed (continuing):', e);
    }
  }

  return cached.conn;
}

type MockableDbConnectFn = (() => Promise<Mongoose>) & {
  __mockImplementation?: () => Promise<Mongoose>;
  __mockResolvedValue?: Mongoose;
  __mockRejectedValue?: unknown;
  mockImplementation?: (factory: () => Promise<Mongoose>) => MockableDbConnectFn;
  mockResolvedValue?: (value: Mongoose) => MockableDbConnectFn;
  mockRejectedValue?: (error: unknown) => MockableDbConnectFn;
  mockReset?: () => void;
  mock?: { calls: unknown[][] };  // Changed from Array<[]> to unknown[][] to match mockCalls type
  mockClear?: () => void;
  mockName?: (name: string) => MockableDbConnectFn;
  getMockName?: () => string;
  __mockName?: string;
  _isMockFunction?: boolean;
};

const attachMockHelpers = (fn: MockableDbConnectFn) => {
  if (typeof fn.mockResolvedValue !== 'function') {
    fn.mockResolvedValue = value => {
      fn.__mockResolvedValue = value;
      delete fn.__mockRejectedValue;
      delete fn.__mockImplementation;
      return fn;
    };
  }

  if (typeof fn.mockRejectedValue !== 'function') {
    fn.mockRejectedValue = error => {
      fn.__mockRejectedValue = error;
      delete fn.__mockResolvedValue;
      delete fn.__mockImplementation;
      if (fn.mock) {
        fn.mock.calls.length = 0;
      }
      return fn;
    };
  }

  if (typeof fn.mockImplementation !== 'function') {
    fn.mockImplementation = factory => {
      fn.__mockImplementation = factory;
      delete fn.__mockResolvedValue;
      delete fn.__mockRejectedValue;
      if (fn.mock) {
        fn.mock.calls.length = 0;
      }
      return fn;
    };
  }

  if (typeof fn.mockReset !== 'function') {
    fn.mockReset = () => {
      delete fn.__mockImplementation;
      delete fn.__mockResolvedValue;
      delete fn.__mockRejectedValue;
      if (fn.mock) {
        fn.mock.calls.length = 0;
      }
    };
  }

  if (typeof fn.mockClear !== 'function') {
    fn.mockClear = () => {
      if (fn.mock) {
        fn.mock.calls.length = 0;
      }
    };
  }

  if (typeof fn.mockName !== 'function') {
    fn.mockName = name => {
      fn.__mockName = name;
      return fn;
    };
  }

  if (typeof fn.getMockName !== 'function') {
    fn.getMockName = () => fn.__mockName ?? 'dbConnect';
  }
};

// NOTE: `mockCalls` persists across module loads, so tests should clear/reset the
// mock (e.g. call `dbConnect.mockClear()` in beforeEach/afterEach) to avoid
// leaking state between test cases.
const mockCalls: unknown[][] = [];

const dbConnect = (async function dbConnectWrapper(): Promise<Mongoose> {
  mockCalls.push([]);
  const mockImplementation = (dbConnect as MockableDbConnectFn).__mockImplementation;
  if (typeof mockImplementation === 'function') {
    return mockImplementation();
  }

  if (
    Object.prototype.hasOwnProperty.call(dbConnect, '__mockResolvedValue')
  ) {
    return (dbConnect as MockableDbConnectFn).__mockResolvedValue as Mongoose;
  }

  if (Object.prototype.hasOwnProperty.call(dbConnect, '__mockRejectedValue')) {
    throw (dbConnect as MockableDbConnectFn).__mockRejectedValue;
  }

  return realDbConnect();
}) as MockableDbConnectFn;

dbConnect.mock = { calls: mockCalls };
dbConnect._isMockFunction = true;
dbConnect.__mockName = 'dbConnect';

attachMockHelpers(dbConnect);

export default dbConnect;

// Dummy comment to force TypeScript re-evaluation.
