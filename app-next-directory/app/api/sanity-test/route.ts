import { client } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';

type FetchFn = (query: string, params?: Record<string, unknown>) => Promise<unknown>;
type NodeEnvFn = () => string | undefined;

const isTestEnv = process.env.NODE_ENV === 'test';

type SanityTestControl = {
  clientFetchOverride?: FetchFn;
  nodeEnvOverride?: NodeEnvFn;
};

const _testControl: SanityTestControl | undefined = isTestEnv
  ? {
      clientFetchOverride: undefined,
      nodeEnvOverride: undefined,
    }
  : undefined;

if (process.env.NODE_ENV === 'test') {
  (module.exports as Record<string, unknown>)._testControl = _testControl;
}

export async function GET(): Promise<Response> {
  try {
    const nodeEnvOverride = _testControl?.nodeEnvOverride;
    const rawEnv = nodeEnvOverride ? nodeEnvOverride() : process.env.NODE_ENV;
    const nodeEnv = rawEnv?.toLowerCase();
    const fetchFn =
      _testControl?.clientFetchOverride ??
      ((query: string, params?: Record<string, unknown>) => client.fetch(query, params));

    if (nodeEnv === 'production') {
      return ApiResponseHandler.error('Not found', 404);
    }

    // Test Sanity connection in non-production environments
    if (nodeEnv !== 'production') {
    }
    // Simple query to test connection
    const result = await fetchFn(`*[_type == "listing"][0...1] {
      _id,
      title
    }`);

    if (nodeEnv !== 'production') {
    }

    return ApiResponseHandler.success({
      message: 'Sanity connection successful',
      config: {
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
      },
      testResult: result,
    });
  } catch (_error) {
    return ApiResponseHandler.error('Sanity connection failed', 500);
  }
}
