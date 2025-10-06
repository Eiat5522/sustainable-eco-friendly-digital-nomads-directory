import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { ApiResponseHandler } from '@/utils/api-response';
import { DEFAULT_CATEGORIES } from '@/lib/constants/categories';

export async function GET() {
  try {
    const categories: string[] = await client.fetch(
      groq`array::unique(*[_type == "listing" && defined(category)].category)`
    );
    // If CMS returns nothing, fall back to default list
    if (!Array.isArray(categories) || categories.length === 0) {
      const fallback = await getDefaultCategories();
      return ApiResponseHandler.success({ categories: fallback });
    }
    return ApiResponseHandler.success({ categories });
  } catch (error) {
    console.error('Categories API error:', error);
    const status =
      typeof error === 'object' && error !== null && typeof (error as { status?: unknown }).status === 'number'
        ? (error as { status: number }).status
        : typeof error === 'object' && error !== null && typeof (error as { statusCode?: unknown }).statusCode === 'number'
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
