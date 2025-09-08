import { ApiResponseHandler } from '@/utils/api-response';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    // Test the connection
    const client = await clientPromise;
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
