import { connection } from 'next/server';
import { groq } from 'next-sanity';
import { cacheHelpers } from '@/lib/cache-strategy';
import { DEFAULT_CATEGORIES } from '@/lib/constants/categories';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import { ApiResponseHandler } from '@/utils/api-response';

type CategoryApiItem = {
  name: string;
  slug: string;
  listingCount: number;
};

export async function GET() {
  // Signal that this route should be dynamically rendered at request time
  // This prevents HANGING_PROMISE_REJECTION errors during prerendering
  await connection();

  try {
    const categories = (await cacheHelpers.categories(async () => {
      return await client.fetch(
        groq`*[_type == "category"] | order(name asc){
          name,
          "slug": slug.current,
          "listingCount": count(*[_type == "listing" && moderation.status == "published" && references(^._id)])
        }`
      );
    })) as CategoryApiItem[] | null;

    // If CMS returns nothing, fall back to default list
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      const fallback = await getDefaultCategories();
      return ApiResponseHandler.success({ categories: fallback });
    }
    const normalized = categories
      .filter(
        category =>
          category &&
          typeof category.name === 'string' &&
          category.name.length > 0 &&
          typeof category.slug === 'string' &&
          category.slug.length > 0
      )
      .map(category => ({
        name: category.name,
        slug: category.slug,
        listingCount:
          typeof category.listingCount === 'number' && Number.isFinite(category.listingCount)
            ? category.listingCount
            : 0,
      }));

    if (normalized.length === 0) {
      const fallback = await getDefaultCategories();
      return ApiResponseHandler.success({ categories: fallback });
    }

    return ApiResponseHandler.success({ categories: normalized });
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
async function getDefaultCategories(): Promise<CategoryApiItem[]> {
  // Use shared default categories to ensure consistency with UI
  return DEFAULT_CATEGORIES.map(category => ({
    name: category,
    slug: category,
    listingCount: 0,
  }));
}
