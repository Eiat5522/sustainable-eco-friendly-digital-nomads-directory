import { ApiResponseHandler } from '@/utils/api-response';

export async function POST() {
  // Temporarily return success without MongoDB interaction
  return ApiResponseHandler.success({ success: true, ok: true });
}
