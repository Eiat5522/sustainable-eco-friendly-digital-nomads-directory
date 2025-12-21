import { connection } from 'next/server';
import { groq } from 'next-sanity';
import { cacheHelpers } from '@/lib/cache-strategy';
import { DEFAULT_CATEGORIES } from '@/lib/constants/categories';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';
export async function GET() {
  // Signal that this route should be dynamically rendered at request time
  // This prevents HANGING_PROMISE_REJECTION errors during prerendering
  await connection();
  
  try {
    const categories = (await cacheHelpers.categories(async () => {
      return await client.fetch(
        groq`array::unique(*[_type == "listing" && defined(category)].category)`
      );
    })) as string[] | null;

    // If CMS returns nothing, fall back to default list
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      const fallback = await getDefaultCategories();
      return ApiResponseHandler.success({ categories: fallback });
    }
    return ApiResponseHandler.success({ categories });
  } catch (error) {
    structuredLogger.error('Categories API error', error, { component: 'categories-api' });
    const status =
      typeof error === 'object' &&
      error !== null &&
      typeof (error as { status?: unknown }).status === 'number'
        ? (error as { status: number }).status
        : typeof error === 'object' &&
            error !== null &&
            typeof (error as { statusCode?: unknown }).statusCode === 'number'
          ? (error as { statusCode: number }).statusCode
          : 500;
    // Fall back to default list on error
    try {
      const fallback = await getDefaultCategories();
      return ApiResponseHandler.success({ categories: fallback });
    } catch (_error) {
      return ApiResponseHandler.error('Failed to fetch categories', status);
    }
  }
}

// Get default categories as a fallback when CMS is unavailable
async function getDefaultCategories(): Promise<string[]> {
  // Use shared default categories to ensure consistency with UI
  return [...DEFAULT_CATEGORIES];
}
