import { MongoClient, Db, Collection } from 'mongodb';

type MockCursor<T = unknown> = {
  sort: (fields?: Record<string, 1 | -1>) => MockCursor;
  skip: (amount: number) => MockCursor;
  limit: (amount: number) => MockCursor;
  project: (fields: Record<string, number>) => MockCursor;
  toArray: () => Promise<T[]>;
  [Symbol.asyncIterator]: () => AsyncGenerator<T, void, unknown>;
};

export type MockCollection = {
  find: (query?: Record<string, unknown>) => MockCursor;
  findOne: <T = unknown>(query?: Record<string, unknown>) => Promise<T | null>;
  insertOne: (doc: unknown) => Promise<{ acknowledged: boolean; insertedId: string }>;
  insertMany: (docs: any[]) => Promise<{ acknowledged: boolean; insertedCount: number; insertedIds: Record<number, string> }>;
  updateOne: (
    filter: Record<string, unknown>,
    update: Record<string, any>,
    options?: { upsert?: boolean }
  ) => Promise<{ acknowledged: boolean; matchedCount: number; modifiedCount: number; upsertedId?: { _id: string } }>;
  countDocuments: (query?: Record<string, unknown>) => Promise<number>;
  aggregate: <T = unknown>(pipeline?: Record<string, unknown>[]) => { toArray: () => Promise<T[]> };
  deleteOne: (query?: Record<string, unknown>) => Promise<{ acknowledged: boolean; deletedCount: number }>;
  createIndex: (fields: Record<string, unknown>, options?: Record<string, unknown>) => Promise<string>;
  createIndexes: (indexes?: Record<string, unknown>[]) => Promise<string[]>;
  __documents: any[];
  __setDocuments: (docs: any[]) => void;
};

export type MockDb = {
  collection: (name: string) => MockCollection;
  collections: Map<string, MockCollection>;
};

type GlobalWithMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
  __TEST_MONGO_DB__?: MockDb;
};

const globalWithMongo = global as GlobalWithMongo;

const allowRealMongoInTests =
  process.env.ALLOW_REAL_MONGO_IN_TESTS === 'true' ||
  process.env.ALLOW_MONGO_IN_TESTS === 'true';

const shouldUseMockDb =
  !allowRealMongoInTests &&
  (
    process.env.NODE_ENV === 'test' ||
    process.env.JEST_WORKER_ID !== undefined ||
    process.env.MOCK_MONGODB === 'true' ||
    process.env.E2E === '1'
  );

let clientPromise: Promise<MongoClient> | undefined;

function initializeClientPromise(): Promise<MongoClient> | undefined {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env.local';
    throw new Error(`MongoDB URI is missing. Please set the MONGODB_URI environment variable in ${envFile}.`);
  }

  const isServerLikeEnvironment = typeof window === 'undefined' || process.env.NODE_ENV === 'test';

  if (isServerLikeEnvironment) {
    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri, {});
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  }

  return clientPromise;
}

function createMockCursor(items: any[] = []): MockCursor {
  let projectedFields: Record<string, number> | null = null;
  let sortFields: Record<string, unknown> | null = null;
  let skipAmount: number = 0;
  let limitAmount: number | null = null;

  const cursor: MockCursor = {
    sort: (fields) => {
      sortFields = fields || null;
      return cursor;
    },
    skip: (amount) => {
      skipAmount = Math.max(0, amount);
      return cursor;
    },
    limit: (amount) => {
      limitAmount = Math.max(0, amount);
      return cursor;
    },
    project: (fields) => {
      projectedFields = fields;
      return cursor;
    },
    toArray: async () => {
      let results = items.map((item) => ({ ...item }));

      // Apply sort
      if (sortFields) {
        const sortEntries = Object.entries(sortFields);
        results.sort((a, b) => {
          for (const [key, direction] of sortEntries) {
            const aVal = getValueByPath(a, key);
            const bVal = getValueByPath(b, key);
            let comparison = 0;
            if (aVal < bVal) comparison = -1;
            if (aVal > bVal) comparison = 1;
            if (direction === -1) comparison = -comparison;
            if (comparison !== 0) return comparison;
          }
          return 0;
        });
      }

      // Apply skip
      if (skipAmount > 0) {
        results = results.slice(skipAmount);
      }

      // Apply limit
      if (limitAmount !== null) {
        results = results.slice(0, limitAmount);
      }

      // Apply projection
      if (projectedFields) {
        const includeKeys = Object.entries(projectedFields)
          .filter(([, flag]) => Boolean(flag))
          .map(([key]) => key);
        if (includeKeys.length) {
          results = results.map((item) => {
            const projected: Record<string, unknown> = {};
            for (const key of includeKeys) {
              projected[key] = getValueByPath(item, key);
            }
            return projected;
          });
        }
      }

      return results;
    },
    [Symbol.asyncIterator]: async function* () {
      let results = items.map((item) => ({ ...item }));

      // Apply sort
      if (sortFields) {
        const sortEntries = Object.entries(sortFields);
        results.sort((a, b) => {
          for (const [key, direction] of sortEntries) {
            const aVal = getValueByPath(a, key);
            const bVal = getValueByPath(b, key);
            let comparison = 0;
            if (aVal < bVal) comparison = -1;
            if (aVal > bVal) comparison = 1;
            if (direction === -1) comparison = -comparison;
            if (comparison !== 0) return comparison;
          }
          return 0;
        });
      }

      // Apply skip
      if (skipAmount > 0) {
        results = results.slice(skipAmount);
      }

      // Apply limit
      if (limitAmount !== null) {
        results = results.slice(0, limitAmount);
      }

      // Apply projection
      if (projectedFields) {
        const includeKeys = Object.entries(projectedFields)
          .filter(([, flag]) => Boolean(flag))
          .map(([key]) => key);
        if (includeKeys.length) {
          results = results.map((item) => {
            const projected: Record<string, unknown> = {};
            for (const key of includeKeys) {
              projected[key] = getValueByPath(item, key);
            }
            return projected;
          });
        }
      }

      // Yield results one by one
      for (const item of results) {
        yield item;
      }
    },
  };

  return cursor;
}

function createMockId(): string {
  return `mock_${Math.random().toString(36).slice(2, 10)}`;
}

function getValueByPath(source: any, path: string): any {
  if (!source || typeof source !== 'object') {
    return undefined;
  }
  return path.split('.').reduce((acc: any, key: string) => {
    if (acc && typeof acc === 'object') {
      return acc[key];
    }
    return undefined;
  }, source);
}

function setValueByPath(target: any, path: string, value: any) {
  const parts = path.split('.');
  const last = parts.pop();
  if (!last) return;
  let cursor = target;
  for (const part of parts) {
    if (cursor[part] === null || cursor[part] === undefined) {
      cursor[part] = {};
    } else if (typeof cursor[part] !== 'object') {
      throw new Error(`Cannot set nested path: ${part} is not an object`);
    }
    cursor = cursor[part];
  }
  cursor[last] = value;
}

function incrementValueByPath(target: any, path: string, amount: number) {
  const current = Number(getValueByPath(target, path)) || 0;
  setValueByPath(target, path, current + amount);
}

function matchesQuery(doc: any, query: Record<string, unknown> = {}): boolean {
  const entries = Object.entries(query);
  if (!entries.length) return true;

  for (const [key, value] of entries) {
    if (key === '$or' && Array.isArray(value)) {
      if (!value.some((clause) => matchesQuery(doc, clause as Record<string, unknown>))) {
        return false;
      }
      continue;
    }
    if (key === '$and' && Array.isArray(value)) {
      if (!value.every((clause) => matchesQuery(doc, clause as Record<string, unknown>))) {
        return false;
      }
      continue;
    }

    const actual = getValueByPath(doc, key);

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if ('$in' in value) {
        const allowed = Array.isArray((value as any).$in) ? (value as any).$in : [];
        if (!allowed.some((candidate: any) => candidate === actual)) {
          return false;
        }
        continue;
      }
      if ('$eq' in value) {
        if (actual !== (value as any).$eq) return false;
        continue;
      }
      if ('$ne' in value) {
        if (actual === (value as any).$ne) return false;
        continue;
      }
    }

    if (actual !== value) {
      return false;
    }
  }

  return true;
}

function runAggregatePipeline(pipeline: Record<string, unknown>[] = [], documents: any[]): any[] {
  return pipeline.reduce((acc, stage) => {
    if (stage.$match && typeof stage.$match === 'object') {
      return acc.filter((doc) => matchesQuery(doc, stage.$match as Record<string, unknown>));
    }

    if (stage.$group && typeof stage.$group === 'object') {
      const groupStage = stage.$group as Record<string, any>;
      const idDescriptor = groupStage._id;
      const groups = new Map<any, Record<string, any>>();

      const getGroupId = (doc: any) => {
        if (typeof idDescriptor === 'string' && idDescriptor.startsWith('$')) {
          return getValueByPath(doc, idDescriptor.slice(1));
        }
        return idDescriptor;
      };

      for (const doc of acc) {
        const groupId = getGroupId(doc);
        if (groupId === undefined) continue;
        if (!groups.has(groupId)) {
          groups.set(groupId, { _id: groupId });
        }
        const bucket = groups.get(groupId)!;

        for (const [field, expression] of Object.entries(groupStage)) {
          if (field === '_id') continue;
          if (expression && typeof expression === 'object' && '$sum' in expression) {
            const sumDescriptor = expression.$sum;
            let value = 0;
            if (typeof sumDescriptor === 'string' && sumDescriptor.startsWith('$')) {
              value = Number(getValueByPath(doc, sumDescriptor.slice(1))) || 0;
            } else if (typeof sumDescriptor === 'number') {
              value = sumDescriptor;
            }
            bucket[field] = (bucket[field] ?? 0) + value;
          }
        }
      }

      return Array.from(groups.values());
    }

    return acc;
  }, documents.slice());
}

function createMockCollection(name: string): MockCollection {
  let documents: any[] = [];

  return {
    find: (query = {}) => {
      const results = documents.filter((doc) => matchesQuery(doc, query));
      return createMockCursor(results);
    },
    findOne: async (query = {}) => {
      const result = documents.find((doc) => matchesQuery(doc, query));
      return result ? { ...result } : null;
    },
    insertOne: async (doc: any) => {
      const payload = { ...doc };
      if (!payload._id) {
        payload._id = createMockId();
      } else if (documents.some(d => d._id === payload._id)) {
        throw new Error(`E11000 duplicate key error: _id: ${payload._id}`);
      }
      documents.push(payload);
      return { acknowledged: true, insertedId: payload._id };
    },
    insertMany: async (docs: any[]) => {
      const insertedIds: Record<number, string> = {};
      const existingIds = new Set(documents.map(d => d._id));

      docs.forEach((doc, index) => {
        const payload = { ...doc };
        if (!payload._id) {
          payload._id = createMockId();
        } else if (existingIds.has(payload._id)) {
          throw new Error(`E11000 duplicate key error: _id: ${payload._id}`);
        }
        existingIds.add(payload._id);
        documents.push(payload);
        insertedIds[index] = payload._id;
      });

      return { acknowledged: true, insertedCount: docs.length, insertedIds };
    },
    updateOne: async (filter: Record<string, unknown>, update: Record<string, any>, options?: { upsert?: boolean }) => {
      const target = documents.find((doc) => matchesQuery(doc, filter));
      if (target) {
        if (update.$set && typeof update.$set === 'object') {
          for (const [path, value] of Object.entries(update.$set)) {
            setValueByPath(target, path, value);
          }
        }
        if (update.$inc && typeof update.$inc === 'object') {
          for (const [path, amount] of Object.entries(update.$inc)) {
            incrementValueByPath(target, path, Number(amount));
          }
        }
        return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
      }

      if (options?.upsert) {
        const payload: Record<string, any> = {};
        if (filter && typeof filter === 'object') {
          for (const [key, value] of Object.entries(filter)) {
            if (typeof key === 'string' && !key.startsWith('$')) {
              setValueByPath(payload, key, value);
            }
          }
        }
        if (update.$setOnInsert && typeof update.$setOnInsert === 'object') {
          for (const [path, value] of Object.entries(update.$setOnInsert)) {
            setValueByPath(payload, path, value);
          }
        }
        if (update.$set && typeof update.$set === 'object') {
          for (const [path, value] of Object.entries(update.$set)) {
            setValueByPath(payload, path, value);
          }
        }
        if (!payload._id) {
          payload._id = createMockId();
        }
        documents.push(payload);
        return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedId: { _id: payload._id } };
      }

      return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    },
    countDocuments: async (query = {}) => documents.filter((doc) => matchesQuery(doc, query)).length,
    aggregate: (pipeline = []) => ({ toArray: async () => runAggregatePipeline(pipeline, documents) }),
    deleteOne: async (query = {}) => {
      const index = documents.findIndex((doc) => matchesQuery(doc, query));
      if (index === -1) {
        return { acknowledged: true, deletedCount: 0 };
      }
      documents.splice(index, 1);
      return { acknowledged: true, deletedCount: 1 };
    },
    createIndex: async () => `${name}_mock_index`,
    createIndexes: async (indexes = []) => indexes.map((_, idx) => `${name}_mock_index_${idx}`),
    __documents: documents,
    __setDocuments: (docs: any[]) => {
      documents = Array.isArray(docs) ? docs.slice() : [];
    },
  };
}

function createMockDb(): MockDb {
  const collections = new Map<string, MockCollection>();
  return {
    collection: (name: string) => {
      if (!collections.has(name)) {
        collections.set(name, createMockCollection(name));
      }
      return collections.get(name)!;
    },
    collections,
  };
}

if (shouldUseMockDb) {
  if (!globalWithMongo.__TEST_MONGO_DB__) {
    globalWithMongo.__TEST_MONGO_DB__ = createMockDb();
  }
} else {
  initializeClientPromise();
  // MongoDB client must only be initialized server-side
}

export async function getDatabase(): Promise<Db | MockDb> {
  if (shouldUseMockDb) {
    if (!globalWithMongo.__TEST_MONGO_DB__) {
      globalWithMongo.__TEST_MONGO_DB__ = createMockDb();
    }
    return globalWithMongo.__TEST_MONGO_DB__;
  }

  // Lazily initialize clientPromise here in case the module was imported
  // before environment variables or global state were set (common in tests
  // that call jest.resetModules()). This preserves the original error
  // behavior when MONGODB_URI is missing.
  if (!clientPromise) {
    initializeClientPromise();
  }

  const resolveClient = async (): Promise<MongoClient | undefined> => {
    if (!clientPromise) {
      return undefined;
    }

    try {
      return await clientPromise;
    } catch (error) {
      if (process.env.NODE_ENV === 'test' && !allowRealMongoInTests) {
        return undefined;
      }
      throw error;
    }
  };

  let client = await resolveClient();

  const recreateClient = async (): Promise<MongoClient | undefined> => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return undefined;
    }

    try {
      if (globalWithMongo._mongoClientPromise) {
        try {
          const oldClient = await globalWithMongo._mongoClientPromise;
          await oldClient.close?.();
        } catch {
          // Ignore errors closing an invalid client
        }
      }

      const newClient = new MongoClient(uri, {});
      const newPromise = newClient.connect();
      globalWithMongo._mongoClientPromise = newPromise;
      clientPromise = newPromise;
      return await resolveClient();
    } catch (error) {
      if (process.env.NODE_ENV === 'test' && !allowRealMongoInTests) {
        return undefined;
      }
      throw error;
    }
  };

  const hasValidDbFunction = (value: MongoClient | undefined): value is MongoClient =>
    Boolean(value && typeof value.db === 'function');

  if (!hasValidDbFunction(client) && process.env.NODE_ENV === 'test') {
    client = await recreateClient();
  }

  if (!hasValidDbFunction(client)) {
    if (process.env.NODE_ENV === 'test' && !allowRealMongoInTests) {
      return createMockDb();
    }
    throw new Error('Client is not a valid MongoClient instance');
  }

  const database = client.db('sustainable-nomads');
  if (!database || typeof (database as any).collection !== 'function') {
    if (process.env.NODE_ENV === 'test' && !allowRealMongoInTests) {
      return createMockDb();
    }
    throw new Error('Database instance is invalid');
  }

  return database;
}

export async function getCollection(name: string): Promise<Collection | MockCollection> {
  if (!name || typeof name !== 'string' || !/^[\w-]+$/.test(name)) {
    throw new Error('Invalid collection name');
  }

  const db = await getDatabase();
  if (!db || typeof db.collection !== 'function') {
    throw new Error('Database instance is invalid');
  }

  const collection = db.collection(name);
  return collection;
}
