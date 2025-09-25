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
  const uri = process.env.MONGODB_URI;
  if (typeof uri !== 'string' || uri.trim().length === 0) {
    return undefined;
  }

  const adapterFactory = resolveAdapterFactory();
  return adapterFactory(clientPromise);
}
