import { ApiResponseHandler } from '@/utils/api-response';
import clientPromise from '@/lib/mongodb';

const isTestEnv = process.env.NODE_ENV === 'test';

export const testControl = {
  get clientOverride() {
    if (!isTestEnv && this._override !== undefined) {
      console.error('testControl.clientOverride should only be used in tests');
    }
    return this._override;
  },
  set clientOverride(value: Promise<typeof clientPromise extends Promise<infer C> ? C : never> | undefined) {
    if (!isTestEnv) {
      throw new Error('testControl.clientOverride cannot be set outside test environment');
    }
    this._override = value;
  },
  _override: undefined as Promise<typeof clientPromise extends Promise<infer C> ? C : never> | undefined,
};

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function GET() {
  try {
    // Test the connection
    const client = await (testControl.clientOverride ?? clientPromise);
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
