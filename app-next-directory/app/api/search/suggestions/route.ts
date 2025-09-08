import { getSearchSuggestions } from '@/lib/search';
import { ApiResponseHandler } from '@/utils/api-response';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return ApiResponseHandler.error('Query parameter is required', 400);
    }

    const suggestions = await getSearchSuggestions(query);
    return ApiResponseHandler.success({ suggestions });
  } catch (error: any) {
    console.error('Error fetching suggestions:', error);
    return ApiResponseHandler.error('Failed to get suggestions', 500, { details: error.message });
  }
}
