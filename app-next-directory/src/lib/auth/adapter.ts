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
  if (
    adapterFactory === MongoDBAdapter &&
    process.env.JEST_WORKER_ID !== undefined &&
    process.env.USE_REAL_MONGODB_FOR_TESTS !== '1'
  ) {
    return undefined;
  }

  const uri = process.env.MONGODB_URI;
  if (typeof uri !== 'string' || uri.trim().length === 0) {
    return undefined;
  }

  return adapterFactory(clientPromise);
}

