import { mockListings } from '@/tests/helpers/test-data';
import { ApiResponseHandler } from '@/utils/api-response';

export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return new Response(null, { status: 404 });
  }
  return ApiResponseHandler.success({ listings: mockListings });
}
