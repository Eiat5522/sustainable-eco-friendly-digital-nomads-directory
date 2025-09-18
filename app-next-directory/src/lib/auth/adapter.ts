import { MongoDBAdapter } from '@auth/mongodb-adapter';
import type { Adapter } from 'next-auth/adapters';

import clientPromise from '@/lib/mongodb';

export function createAuthAdapter(): Adapter | undefined {
  if (!process.env.MONGODB_URI) {
    return undefined;
  }

  return MongoDBAdapter(clientPromise);
}
