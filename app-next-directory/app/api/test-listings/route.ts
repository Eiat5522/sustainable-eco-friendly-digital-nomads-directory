import { createTestData } from '@/tests/helpers/test-data';
import { ApiResponseHandler } from '@/utils/api-response';

type CreateTestDataFn = () => { listings: unknown };
type NodeEnvFn = () => string | undefined;

export const testControl = {
  createTestDataOverride: undefined as CreateTestDataFn | undefined,
  nodeEnvOverride: undefined as NodeEnvFn | undefined,
};

export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  const nodeEnv = testControl.nodeEnvOverride ? testControl.nodeEnvOverride() : process.env.NODE_ENV;
  if ((nodeEnv ?? '').toLowerCase() === 'production') {
    return new Response(null, { status: 404 });
  }
  const createData = testControl.createTestDataOverride ?? createTestData;
  const { listings } = createData();
  return ApiResponseHandler.success({ listings });
}
