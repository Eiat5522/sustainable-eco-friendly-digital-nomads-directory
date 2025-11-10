import { getSearchSuggestions } from '@/lib/search';
import { ApiResponseHandler } from '@/utils/api-response';

const isTestEnv = process.env.NODE_ENV === 'test';

export const _testControl = isTestEnv
  ? {
      getSearchSuggestionsOverride: undefined as typeof getSearchSuggestions | undefined,
    }
  : undefined;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get('q') ?? '';
    const query = raw.trim();

    if (!query) {
      return ApiResponseHandler.error('Missing required query param "q"', 400, { code: 'MISSING_QUERY', param: 'q' });
    }
    if (query.length > 256) {
      return ApiResponseHandler.error('Query too long', 400, { code: 'QUERY_TOO_LONG', maxLength: 256 });
    }
    const fetchSuggestions = _testControl?.getSearchSuggestionsOverride ?? getSearchSuggestions;
    const suggestions = await fetchSuggestions(query);
    return ApiResponseHandler.success({ suggestions });
  } catch (error: unknown) {
    console.error('Error fetching suggestions:', error);
    const details = error instanceof Error ? error.message : String(error);
    const meta = process.env.NODE_ENV !== 'production' ? { details } : undefined;
    return ApiResponseHandler.error('Failed to get suggestions', 500, meta);
  }
}
