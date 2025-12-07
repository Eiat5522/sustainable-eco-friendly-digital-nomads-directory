import mongoose, { type Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
// FORTEST: Support both SKIP_DB_CONNECT and DISABLE_MONGODB_DURING_BUILD for build-time safety
const skipDbConnect = process.env.SKIP_DB_CONNECT === '1' || process.env.DISABLE_MONGODB_DURING_BUILD === '1' || process.env.DISABLE_MONGODB_DURING_BUILD === 'true';
const isJestEnvironment = Boolean(process.env?.JEST_WORKER_ID);
const shouldUseRealMongoDuringTests =
  isJestEnvironment && process.env.JEST_USE_REAL_MONGOOSE === '1';

const shouldRequireMongoUri =
  !skipDbConnect && (!isJestEnvironment || shouldUseRealMongoDuringTests);

// FORTEST: Move error throw into function call to prevent module-scope exceptions during build
function validateMongoUri() {
  if (shouldRequireMongoUri && !MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required');
  }
}

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

let cached = (global as typeof globalThis & { mongoose?: MongooseCache }).mongoose;

if (!cached) {
  cached = (global as typeof globalThis & { mongoose?: MongooseCache }).mongoose = {
    conn: null,
    promise: null,
  };
}

async function connectWithCaching(): Promise<Mongoose> {
  // FORTEST: Validate URI only when actually connecting, not at module scope
  validateMongoUri();
  
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

type DbConnectFn = (...args: []) => Promise<Mongoose>;

type Awaitable<T> = T | Promise<T>;

type MockResult<T> = { type: 'return'; value: T } | { type: 'throw'; value: unknown };

interface MockableDbConnect extends DbConnectFn {
  mock: {
    calls: unknown[][];
    results: MockResult<Mongoose>[];
    instances: unknown[];
    contexts: unknown[];
    lastCall?: unknown[];
    name?: string;
  };
  mockClear: () => MockableDbConnect;
  mockReset: () => MockableDbConnect;
  mockImplementation: (impl: () => Awaitable<Mongoose>) => MockableDbConnect;
  mockResolvedValue: (value: Mongoose | undefined) => MockableDbConnect;
  mockRejectedValue: (error: unknown) => MockableDbConnect;
  mockName: (name: string) => MockableDbConnect;
  getMockName: () => string;
  _isMockFunction: true;
}

const createMockableDbConnect = (): MockableDbConnect => {
  const state: {
    implementation?: () => Promise<Mongoose>;
    calls: unknown[][];
    results: MockResult<Mongoose>[];
  } = {
    implementation: undefined,
    calls: [],
    results: [],
  };
  let mockName = 'dbConnect';

  const execute = async (impl: () => Promise<Mongoose>): Promise<Mongoose> => {
    try {
      const value = await impl();
      state.results.push({ type: 'return', value });
      return value;
    } catch (error) {
      state.results.push({ type: 'throw', value: error });
      throw error;
    }
  };

  const wrapImplementation = (impl: () => Awaitable<Mongoose>): (() => Promise<Mongoose>) => {
    return async () => Promise.resolve(impl()).then(value => value as Mongoose);
  };

  const defaultImplementation = shouldUseRealMongoDuringTests
    ? connectWithCaching
    : async () => ({}) as Mongoose;

  const mockFn = async function dbConnectMock(): Promise<Mongoose> {
    state.calls.push([]);
    const impl = state.implementation ?? defaultImplementation;
    return execute(impl);
  } as MockableDbConnect;

  const setImplementation = (impl: () => Promise<Mongoose>): MockableDbConnect => {
    state.implementation = impl;
    return mockFn;
  };

  mockFn.mockImplementation = impl => setImplementation(wrapImplementation(impl));
  mockFn.mockResolvedValue = value =>
    setImplementation(wrapImplementation(() => value as Mongoose));
  mockFn.mockRejectedValue = error =>
    setImplementation(async () => {
      throw error;
    });
  mockFn.mockClear = () => {
    state.calls = [];
    state.results = [];
    return mockFn;
  };
  mockFn.mockReset = () => {
    state.calls = [];
    state.results = [];
    state.implementation = undefined;
    return mockFn;
  };
  mockFn.mockName = (name: string) => {
    mockName = name;
    return mockFn;
  };
  mockFn.getMockName = () => mockName;

  Object.defineProperty(mockFn, '_isMockFunction', { value: true });
  Object.defineProperty(mockFn, 'mock', {
    configurable: true,
    enumerable: false,
    get: () => ({
      calls: state.calls,
      results: state.results,
      instances: [],
      contexts: [],
      lastCall: state.calls[state.calls.length - 1],
      name: mockName,
    }),
  });

  return mockFn;
};

// Choose the exported dbConnect implementation:
// - In Jest environments use a mockable function so tests can override it.
// - If SKIP_DB_CONNECT=1 (e.g., during Next build), provide a mock that
//   resolves to a harmless empty object to avoid network connections.
// - Otherwise use the real connectWithCaching implementation.
let dbConnect: DbConnectFn;
if (isJestEnvironment) {
  dbConnect = createMockableDbConnect();
} else if (skipDbConnect) {
  const mock = createMockableDbConnect();
  // Resolve to an empty object - callers that expect a Mongoose instance
  // should still work for build-time static evaluation. Tests can replace
  // this mock via mockImplementation when needed.
  mock.mockResolvedValue({} as unknown as Mongoose);
  dbConnect = mock;
} else {
  dbConnect = connectWithCaching;
}

export default dbConnect;
