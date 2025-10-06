import mongoose, { type Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is required');
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

const isJestEnvironment = Boolean(process.env?.JEST_WORKER_ID);

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
    return async () => Promise.resolve(impl()).then((value) => value as Mongoose);
  };

  const mockFn = (async function dbConnectMock(): Promise<Mongoose> {
    state.calls.push([]);
    const impl = state.implementation ?? connectWithCaching;
    return execute(impl);
  }) as MockableDbConnect;

  const setImplementation = (impl: () => Promise<Mongoose>): MockableDbConnect => {
    state.implementation = impl;
    return mockFn;
  };

  mockFn.mockImplementation = (impl) => setImplementation(wrapImplementation(impl));
  mockFn.mockResolvedValue = (value) => setImplementation(wrapImplementation(() => value as Mongoose));
  mockFn.mockRejectedValue = (error) => setImplementation(async () => {
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

const dbConnect: DbConnectFn = isJestEnvironment ? createMockableDbConnect() : connectWithCaching;

export default dbConnect;
