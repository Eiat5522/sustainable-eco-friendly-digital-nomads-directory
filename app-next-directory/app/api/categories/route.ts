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
let __schemaCategoriesCache: string[] | null = null;

type SchemaField = {
  name: string;
  options?: { list?: Array<string | { title?: string; value?: string }> };
};

async function getSchemaCategoriesFallback(): Promise<string[]> {
  if (__schemaCategoriesCache) return __schemaCategoriesCache;
  try {
    // listing schema lives at repo root under sanity/schemas/listing.js
    // path from this file: ../../../../ -> repo root, then sanity/schemas/listing.js
    const mod = await import('../../../../sanity/schemas/listing.js');
    // default export is defineType({...}) object
    const listingSchema: any = (mod as any).default || mod;
    const fields: SchemaField[] = Array.isArray(listingSchema?.fields) ? listingSchema.fields : [];
    const categoryField = fields.find((f) => f?.name === 'category');
    const list = categoryField?.options?.list ?? [];
    const values = (list as Array<string | { value?: string }>)
      .map((opt) => (typeof opt === 'string' ? opt : (typeof opt?.value === 'string' ? opt.value : '')))
      .map((v) => v.trim())
      .filter(Boolean);
    // Deduplicate and sort for stability (case-insensitive)
    const out = Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    __schemaCategoriesCache = out.length ? out : [...DEFAULT_CATEGORIES];
    return __schemaCategoriesCache;
  } catch (err) {
    // Hard fallback if schema import fails
    console.warn('getSchemaCategoriesFallback: import/parse failed, using defaults.', err);
    __schemaCategoriesCache = [...DEFAULT_CATEGORIES];
    return __schemaCategoriesCache;
  }
}
