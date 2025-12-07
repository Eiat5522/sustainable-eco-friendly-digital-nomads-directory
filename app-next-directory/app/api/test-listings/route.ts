import { ApiResponseHandler } from '@/utils/api-response';

type CreateTestDataFn = () => { listings: unknown };
type NodeEnvFn = () => string | undefined;

const isTestEnv = process.env.NODE_ENV === 'test';

type TestListingsControl = {
  createTestDataOverride?: CreateTestDataFn;
  nodeEnvOverride?: NodeEnvFn;
};

const _testControl: TestListingsControl | undefined = isTestEnv
  ? {
      createTestDataOverride: undefined,
      nodeEnvOverride: undefined,
    }
  : undefined;

if (process.env.NODE_ENV === 'test') {
  (module.exports as Record<string, unknown>)._testControl = _testControl;
}

// MIGRATED: Removed `export const dynamic` to be compatible with `nextConfig.cacheComponents`.
// This endpoint is intended for local/test use only.

export async function GET(): Promise<Response> {
  const nodeEnvOverride = _testControl?.nodeEnvOverride;
  const nodeEnv = nodeEnvOverride ? nodeEnvOverride() : process.env.NODE_ENV;
  if ((nodeEnv ?? '').toLowerCase() === 'production') {
    return new Response(null, { status: 404 });
  }
  // Load test helpers lazily to avoid bundlers trying to statically
  // resolve test-only modules during a production build.
  const testModule = await import('@/tests/helpers/test-data');
  const createData = _testControl?.createTestDataOverride ?? testModule.createTestData;
  const { listings } = createData();
  return ApiResponseHandler.success({ listings });
}
