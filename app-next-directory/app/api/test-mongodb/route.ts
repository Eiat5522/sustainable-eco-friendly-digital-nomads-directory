import { ApiResponseHandler } from '@/utils/api-response';
import clientPromise from '@/lib/mongodb';

const isTestEnv = process.env.NODE_ENV === 'test';

export const _testControl = isTestEnv
  ? {
      clientOverride: undefined as Promise<typeof clientPromise extends Promise<infer C> ? C : never> | undefined,
    }
  : undefined;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET() {
  try {
    // Test the connection
    const client = await (_testControl?.clientOverride ?? clientPromise);
    await client.db().command({ ping: 1 });

    return ApiResponseHandler.success({ message: 'Successfully connected to MongoDB!' });
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    return ApiResponseHandler.error(
      process.env.NODE_ENV === 'production'
        ? 'Failed to connect to MongoDB'
        : (error instanceof Error ? error.message : 'Failed to connect to MongoDB'),
      500
    );
  }
}
