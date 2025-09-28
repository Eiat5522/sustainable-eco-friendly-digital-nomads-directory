import { MongoDBAdapter } from '@auth/mongodb-adapter';
import type { Adapter } from 'next-auth/adapters';

import clientPromise from '@/lib/mongodb';

function resolveAdapterFactory() {
  const globalMock = (globalThis as Record<string, unknown>).__mongoAdapterMock;
  if (typeof globalMock === 'function') {
    return globalMock as typeof MongoDBAdapter;
  }
  return MongoDBAdapter;
}

export function createAuthAdapter(): Adapter | undefined {
  const adapterFactory = resolveAdapterFactory();
  const hasJestGlobal = typeof (globalThis as { jest?: unknown }).jest !== 'undefined';
  const isJestEnvironment =
    hasJestGlobal ||
    process.env.JEST_WORKER_ID !== undefined ||
    process.env.JEST_UNIT_ONLY === '1' ||
    process.env.NODE_ENV === 'test';
  const isJestMockAdapter =
    typeof adapterFactory === 'function' && 'mock' in adapterFactory;

  const shouldSkipAdapter =
    (adapterFactory === MongoDBAdapter || isJestMockAdapter) &&
    isJestEnvironment &&
    process.env.USE_REAL_MONGODB_FOR_TESTS !== '1';

  let resolvedAdapter: Adapter | undefined;

  if (!shouldSkipAdapter) {
    const uri = process.env.MONGODB_URI;
    const hasValidUri = typeof uri === 'string' && uri.trim().length > 0;

    if (hasValidUri) {
      resolvedAdapter = adapterFactory(clientPromise);
    }
  }

  return resolvedAdapter;
}
