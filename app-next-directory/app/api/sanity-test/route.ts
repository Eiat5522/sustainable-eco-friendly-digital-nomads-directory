import { ApiResponseHandler } from '@/utils/api-response';
import { client } from '@/lib/sanity/client';

export async function GET(): Promise<Response> {
  try {
    const nodeEnv = process.env.NODE_ENV?.toLowerCase();

    if (nodeEnv === 'production') {
      return ApiResponseHandler.error('Not found', 404);
    }

    // Test Sanity connection in non-production environments
    if (nodeEnv !== 'production') {
      console.log('Testing Sanity connection...');
      console.log('Sanity Config:', {
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
      });
    }
    // Simple query to test connection
    const result = await client.fetch(`*[_type == "listing"][0...1] {
      _id,
      title
    }`);

    if (nodeEnv !== 'production') {
      console.log('Test query result:', JSON.stringify(result, null, 2));
    }

    return ApiResponseHandler.success({
      message: 'Sanity connection successful',
      config: {
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
      },
      testResult: result
    });
  } catch (error) {
    console.error('Sanity test error:', error);
    return ApiResponseHandler.error('Sanity connection failed', 500);
  }
}
