import clientPromise from '@/lib/mongodb';
import { ApiResponseHandler } from '@/utils/api-response';

const isTestEnv = process.env.NODE_ENV === 'test';

type MongoTestControl = {
  clientOverride?: Promise<typeof clientPromise extends Promise<infer C> ? C : never>;
};

const _testControl: MongoTestControl | undefined = isTestEnv
  ? {
      clientOverride: undefined,
    }
  : undefined;

if (process.env.NODE_ENV === 'test') {
  (module.exports as Record<string, unknown>)._testControl = _testControl;
}

// MIGRATED: Removed route-segment exports (`dynamic`, `runtime`) to be compatible
// with `nextConfig.cacheComponents`. This endpoint remains runtime-only.
export async function GET() {
  try {
    // Test the connection
    const client = await (_testControl?.clientOverride ?? clientPromise);
    await client.db().command({ ping: 1 });

    return ApiResponseHandler.success({ message: 'Successfully connected to MongoDB!' });
  } catch (error) {
    return ApiResponseHandler.error(
      process.env.NODE_ENV === 'production'
        ? 'Failed to connect to MongoDB'
        : error instanceof Error
          ? error.message
          : 'Failed to connect to MongoDB',
      500
    );
  }
}
