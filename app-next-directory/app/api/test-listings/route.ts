import { mockListings } from '@/tests/helpers/test-data';
import { ApiResponseHandler } from '@/utils/api-response';

export async function GET() {
  return ApiResponseHandler.success({ listings: mockListings });
}
