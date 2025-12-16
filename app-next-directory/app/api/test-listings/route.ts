import { ApiResponseHandler } from '@/utils/api-response';

type TestListingsData = { listings: unknown };
type CreateTestDataFn = (overrides?: Partial<TestListingsData>) => TestListingsData;
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
export async function GET(): Promise<Response> {
  const nodeEnvOverride = _testControl?.nodeEnvOverride;
  const nodeEnv = nodeEnvOverride ? nodeEnvOverride() : process.env.NODE_ENV;
  if ((nodeEnv ?? '').toLowerCase() === 'production') {
    return new Response(null, { status: 404 });
  }
  // Load test helpers lazily to avoid bundlers trying to statically
  // resolve test-only modules during a production build.
  const testModule = await import('@/tests/helpers/test-data');
  const createData: CreateTestDataFn =
    _testControl?.createTestDataOverride ?? (testModule.createTestData as CreateTestDataFn);
  const { listings } = createData();
  return ApiResponseHandler.success({ listings });
}
