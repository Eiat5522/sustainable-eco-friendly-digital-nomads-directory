import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { ApiResponseHandler } from '@/utils/api-response';

export async function GET() {
  try {
    const categories: string[] = await client.fetch(
      groq`array::unique(*[_type == "listing" && defined(category)].category)`
    );
    // If CMS returns nothing, fall back to schema-defined list
    if (!Array.isArray(categories) || categories.length === 0) {
      const fallback = await getSchemaCategoriesFallback();
      return ApiResponseHandler.success({ categories: fallback });
    }
    return ApiResponseHandler.success({ categories });
  } catch (error) {
    console.error('Categories API error:', error);
    const anyErr = error as any;
    const status = Number.isInteger(anyErr?.status) ? anyErr.status
                 : Number.isInteger(anyErr?.statusCode) ? anyErr.statusCode
                 : 500;
    // Fall back to schema-defined list on error
    try {
      const fallback = await getSchemaCategoriesFallback();
      return ApiResponseHandler.success({ categories: fallback });
    } catch (e) {
      return ApiResponseHandler.error('Failed to fetch categories', status);
    }
  }
}

// Extract categories from Sanity listing schema options list as a fallback
const DEFAULT_CATEGORIES = ['coworking', 'cafe', 'accommodation', 'restaurant', 'activities'] as const;

async function getSchemaCategoriesFallback(): Promise<string[]> {
  // Use hardcoded categories to avoid importing Sanity schema that pulls in client-side dependencies
  return [...DEFAULT_CATEGORIES];
}
