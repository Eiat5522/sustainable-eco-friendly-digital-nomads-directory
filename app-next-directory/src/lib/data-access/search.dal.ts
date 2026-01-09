/**
 * Search Data Access Layer (DAL)
 *
 * Centralizes all search-related data fetching and caching operations.
 * Follows Next.js 16 best practices for Cache Components.
 *
 * Design principles:
 * - Single source of truth for search data operations
 * - Type-safe: no `any` types
 * - Cacheable: uses 'use cache' directive with proper tags for identical searches
 * - Testable: can be mocked for unit tests
 *
 * Note: Search results are dynamic by nature (depend on searchParams),
 * but we can still cache identical search queries for short periods.
 */

import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { groq } from 'next-sanity';
import { z } from 'zod';

import { structuredLogger as logger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import type { ListingSummaryDTO } from '@/types/dto';
import type { SearchParamRecord } from '@/types/search';
import { escapeGroqLiteral, escapeGroqMatch } from '@/utils/sanitize';

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_PAGE_SIZES = [12, 24, 48, 96] as const;
export const MAX_PARAM_VALUE_LENGTH = 1000;

// ============================================================================
// GROQ Queries
// ============================================================================

/**
 * Query for search facets (categories, destinations, amenities)
 * These are relatively static and can be cached longer
 */
const SEARCH_FACETS_QUERY = groq`{
  "categories": array::unique(*[_type == "listing" && moderation.status == "published"].category),
  "destinations": array::unique(*[_type == "listing" && moderation.status == "published"].city->name),
  "amenities": array::unique(*[_type == "listing" && moderation.status == "published"].amenities[]->name)
}`;

// ============================================================================
// Types
// ============================================================================

export interface SearchPagination {
  page: number;
  totalPages: number;
  hasMore: boolean;
  limit: number;
  total: number;
}

export interface SearchFetchSuccess {
  ok: true;
  listings: ListingSummaryDTO[];
  pagination: SearchPagination;
  pageSizeOptions: number[];
  pages: (number | '…')[];
}

export interface SearchFetchError {
  ok: false;
  reason: 'response' | 'exception';
  status?: number;
  statusText?: string;
}

export type SearchFetchResult = SearchFetchSuccess | SearchFetchError;

export interface SearchFacets {
  categories: string[];
  destinations: string[];
  amenities: string[];
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

const tagSchema = z.union([z.string(), z.object({ name: z.string() })]);

const apiItemSchema = z.object({
  _id: z.string().optional(),
  name: z.string().optional(),
  slug: z.union([z.string(), z.object({ current: z.string() })]).optional(),
  category: z.string().optional(),
  city: z
    .object({
      _id: z.string().optional(),
      name: z.string().optional(),
      slug: z.string().optional(),
      country: z.string().optional(),
    })
    .nullable()
    .optional(),
  location: z
    .object({
      _id: z.string().optional(),
      name: z.string().optional(),
      slug: z.string().optional(),
      country: z.string().optional(),
    })
    .nullable()
    .optional(),
  primaryImage: z
    .object({
      asset: z
        .object({
          url: z.string(),
        })
        .optional(),
    })
    .nullable()
    .optional(),
  shortDescription: z.string().nullable().optional(),
  amenityNames: z.array(z.string()).nullable().optional(),
  moderation: z.object({ featured: z.boolean().optional() }).optional(),
  ecoFocusTags: z.array(tagSchema).nullable().optional(),
  ecoFeatures: z.array(tagSchema).nullable().optional(),
  digitalNomadFeatures: z.array(tagSchema).nullable().optional(),
});

const searchResponseSchema = z
  .object({
    data: z
      .object({
        results: z.array(z.unknown()).optional(),
        pagination: z
          .object({
            page: z.number().optional(),
            totalPages: z.number().optional(),
            hasMore: z.boolean().optional(),
            limit: z.number().optional(),
            total: z.number().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough();

// ============================================================================
// Internal Helpers
// ============================================================================

const isBuildMode = process.env.NEXT_BUILD_MODE === 'true';

const isPrerenderRejection = (error: unknown): boolean => {
  if (!error) return false;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && 'message' in error
        ? String((error as { message?: unknown }).message ?? '')
        : '';
  if (message.includes('During prerendering')) return true;
  if (typeof error === 'object' && 'digest' in error) {
    return (error as { digest?: unknown }).digest === 'HANGING_PROMISE_REJECTION';
  }
  return false;
};

async function fetchFromSanity<T>(
  query: string,
  params?: Record<string, unknown>
): Promise<T | null> {
  const fetchClient =
    isBuildMode && typeof client.withConfig === 'function'
      ? client.withConfig({ maxRetries: 0 })
      : client;
  try {
    return await fetchClient.fetch<T>(query, params);
  } catch (err: unknown) {
    if (isBuildMode && isPrerenderRejection(err)) {
      logger.warn('Sanity fetch rejected during prerender; using fallback', {
        component: 'search.dal',
      });
      return null;
    }
    logger.error('Sanity fetch failed', {
      component: 'search.dal',
      error: err,
    });
    throw err;
  }
}

function extractTagNames(
  list?: Array<z.infer<typeof tagSchema> | null | undefined> | null
): string[] {
  if (!Array.isArray(list)) return [];
  const tags: string[] = [];
  for (const entry of list) {
    if (typeof entry === 'string') {
      const name = entry.trim();
      if (name.length > 0) tags.push(name);
      continue;
    }
    if (entry && typeof entry === 'object' && typeof entry.name === 'string') {
      const name = entry.name.trim();
      if (name.length > 0) tags.push(name);
    }
  }
  return tags;
}

function mapResultToDTO(item: unknown): ListingSummaryDTO {
  const parseResult = apiItemSchema.safeParse(item);
  if (!parseResult.success) {
    throw new Error('Invalid search result data');
  }
  const validated = parseResult.data;
  const city = validated.city ?? validated.location ?? null;
  const imageUrl: string | undefined = validated?.primaryImage?.asset?.url ?? undefined;
  const slugValue = validated.slug;
  const slug: string = typeof slugValue === 'string' ? slugValue : (slugValue?.current ?? '');
  const ecoFocusTags = extractTagNames(validated.ecoFocusTags ?? validated.ecoFeatures);
  const digitalNomadFeatures = extractTagNames(validated.digitalNomadFeatures);
  return {
    id: String(validated._id ?? slug ?? `temp-${Date.now()}-${Math.random()}`),
    name: String(validated.name ?? ''),
    slug,
    type: (validated.category ?? 'coworking') as ListingSummaryDTO['type'],
    city: city
      ? {
          id: String(city._id ?? ''),
          name: String(city.name ?? ''),
          slug: String(city.slug ?? ''),
          country: String(city.country ?? ''),
        }
      : null,
    imageUrl,
    shortDescription: validated.shortDescription ?? undefined,
    amenityNames: Array.isArray(validated.amenityNames) ? validated.amenityNames : undefined,
    featured: Boolean(validated.moderation?.featured === true),
    ecoFocusTags: ecoFocusTags.length > 0 ? ecoFocusTags : undefined,
    digitalNomadFeatures: digitalNomadFeatures.length > 0 ? digitalNomadFeatures : undefined,
  };
}

// ============================================================================
// URL Building Helpers
// ============================================================================

/**
 * Build URLSearchParams from a SearchParamRecord
 */
export function buildSearchParams(record: SearchParamRecord): URLSearchParams {
  const params = new URLSearchParams();
  const entries = Object.entries(record);
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  for (const [key, value] of entries) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach(entry => params.append(key, String(entry)));
    } else {
      params.set(key, String(value));
    }
  }

  if (!params.has('page')) params.set('page', '1');
  if (!params.has('limit')) params.set('limit', '12');
  params.set('facets', '1');

  return params;
}

/**
 * Build a search href with optional overrides
 */
export function buildSearchHref(
  basePath: string,
  searchParams: SearchParamRecord,
  overrides: Record<string, string | undefined> = {}
): string {
  const params = new URLSearchParams();
  const entries = Object.entries(searchParams);
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  for (const [key, value] of entries) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach(entry => params.append(key, String(entry)));
    } else {
      params.append(key, String(value));
    }
  }

  for (const [key, value] of Object.entries(overrides)) {
    params.delete(key);
    if (value !== undefined) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * Generate page numbers with ellipsis for pagination
 */
export function getPageNumbers(page: number, totalPages: number): (number | '…')[] {
  const normalizedPage = Math.max(1, Math.floor(page));
  const normalizedTotalPages = Math.max(1, Math.floor(totalPages));

  if (normalizedTotalPages <= 7) {
    return Array.from({ length: normalizedTotalPages }, (_, index) => index + 1);
  }

  const pages: (number | '…')[] = [];
  pages.push(1);

  if (normalizedPage > 3) {
    pages.push('…');
  }

  const start = Math.max(2, normalizedPage - 1);
  const end = Math.min(normalizedTotalPages - 1, normalizedPage + 1);

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  if (normalizedPage < normalizedTotalPages - 2) {
    pages.push('…');
  }

  pages.push(normalizedTotalPages);
  return pages;
}

// ============================================================================
// GROQ Query Building
// ============================================================================

/**
 * Build GROQ WHERE clause from search filters
 */
export function buildWhereClause({
  q,
  categories,
  destinations,
  amenities,
  nomadFeatures,
}: {
  q: string;
  categories: string[];
  destinations: string[];
  amenities: string[];
  nomadFeatures: string[];
}): string {
  // Validate inputs to prevent overly complex queries (DoS)
  const MAX_ARRAY_SIZE = 50;
  const MAX_STRING_LENGTH = 200;

  if (
    categories.length > MAX_ARRAY_SIZE ||
    destinations.length > MAX_ARRAY_SIZE ||
    amenities.length > MAX_ARRAY_SIZE ||
    nomadFeatures.length > MAX_ARRAY_SIZE
  ) {
    throw new Error('Too many filter values provided');
  }

  if (q.length > MAX_STRING_LENGTH) {
    throw new Error('Search query too long');
  }

  const filters: string[] = ['_type == "listing"', 'moderation.status == "published"'];

  if (q) {
    const pattern = escapeGroqMatch(q.toLowerCase());
    filters.push(
      '(' +
        [
          `lower(name) match "*${pattern}*"`,
          `lower(coalesce(slug.current, slug)) match "*${pattern}*"`,
          `lower(category) match "*${pattern}*"`,
          `lower(city->name) match "*${pattern}*"`,
          `lower(city->country) match "*${pattern}*"`,
          `lower(shortDescription) match "*${pattern}*"`,
        ].join(' || ') +
        ')'
    );
  }
  if (categories.length) {
    const group = categories.map(c => `category == "${escapeGroqLiteral(c)}"`).join(' || ');
    filters.push(`(${group})`);
  }

  if (destinations.length) {
    const eq = destinations.map(d => `city->name == "${escapeGroqLiteral(d)}"`).join(' || ');
    const match = destinations.map(d => `city->name match "*${escapeGroqMatch(d)}*"`).join(' || ');
    filters.push(`((${eq}) || (${match}))`);
  }

  if (amenities.length) {
    const amenityNameIn = amenities
      .map(a => `("${escapeGroqLiteral(a)}" in amenities[]->name)`)
      .join(' || ');
    const dnFeatureNameIn = amenities
      .map(a => `array::contains(digitalNomadFeatures[]->name, "${escapeGroqLiteral(a)}")`)
      .join(' || ');
    filters.push(`((${amenityNameIn}) || (${dnFeatureNameIn}))`);
  }
  if (nomadFeatures.length) {
    const nfs = nomadFeatures
      .map(nf => `array::contains(digitalNomadFeatures[]->name, "${escapeGroqLiteral(nf)}")`)
      .join(' || ');
    filters.push(`(${nfs})`);
  }

  return filters.join(' && ');
}

// ============================================================================
// Public DAL Functions
// ============================================================================

/**
 * Fetch search facets (categories, destinations, amenities)
 * These are relatively static and can be cached for hours
 *
 * @returns SearchFacets with available filter options
 */
export async function getSearchFacets(): Promise<SearchFacets> {
  'use cache';
  cacheLife('hours');
  cacheTag('search-facets', 'listings');

  try {
    const result = await fetchFromSanity<SearchFacets>(SEARCH_FACETS_QUERY);
    return result ?? { categories: [], destinations: [], amenities: [] };
  } catch (error) {
    logger.error('Failed to fetch search facets', error, {
      component: 'search.dal',
    });
    return { categories: [], destinations: [], amenities: [] };
  }
}

/**
 * Execute search against the listings
 * Uses internal API route handler for consistent behavior
 *
 * Search results are inherently dynamic, but we use cache tags
 * for on-demand invalidation when listings change.
 *
 * @param searchParams - The search parameters
 * @returns SearchFetchResult with listings or error
 */
export async function executeSearch(
  searchParams: SearchParamRecord
): Promise<SearchFetchResult> {
  'use cache';
  cacheLife('minutes'); // Short cache for search results
  cacheTag('search-results', 'listings');

  // Import the route handler dynamically to avoid circular dependencies
  // Using relative path since @/ alias points to src/, not app/
  const { GET: searchGetHandler } = await import('../../../app/api/search/route');

  const params = buildSearchParams(searchParams);
  const url = new URL('/api/search', 'http://localhost');
  url.search = params.toString();

  try {
    const { NextRequest } = await import('next/server');
    const request = new NextRequest(url.toString());
    const response = await searchGetHandler(request);

    if (!response.ok) {
      return {
        ok: false,
        reason: 'response',
        status: response.status,
        statusText: response.statusText,
      };
    }

    const payload = await response.json();
    const parsedResponse = searchResponseSchema.safeParse(payload);

    const rawResults =
      parsedResponse.success && Array.isArray(parsedResponse.data.data?.results)
        ? (parsedResponse.data.data?.results ?? [])
        : [];

    let skippedCount = 0;
    const listings = rawResults.reduce<ListingSummaryDTO[]>((accumulator, item) => {
      try {
        accumulator.push(mapResultToDTO(item));
      } catch (_error) {
        skippedCount += 1;
      }
      return accumulator;
    }, []);

    if (skippedCount > 0) {
      logger.warn(`Skipped ${skippedCount} invalid search results`, {
        component: 'search.dal',
      });
    }

    const paginationData = parsedResponse.success
      ? (parsedResponse.data.data?.pagination ?? {})
      : {};
    const pageFromResponse = Number(paginationData?.page ?? params.get('page') ?? 1);
    const totalPagesFromResponse = Number(paginationData?.totalPages ?? 1);
    const limitFromResponse = Number(paginationData?.limit ?? params.get('limit') ?? 12);

    const page = Math.max(1, Number.isFinite(pageFromResponse) ? Math.trunc(pageFromResponse) : 1);
    const totalPages = Math.max(
      1,
      Number.isFinite(totalPagesFromResponse) ? Math.trunc(totalPagesFromResponse) : 1
    );
    const limit = Math.max(
      1,
      Number.isFinite(limitFromResponse) ? Math.trunc(limitFromResponse) : 12
    );

    const total = Number.isFinite(paginationData?.total ?? 0)
      ? Number(paginationData?.total ?? 0)
      : listings.length;
    const hasMore = Boolean(paginationData?.hasMore ?? page * limit < total);

    const pageSizeOptions = DEFAULT_PAGE_SIZES.includes(
      limit as (typeof DEFAULT_PAGE_SIZES)[number]
    )
      ? Array.from(DEFAULT_PAGE_SIZES)
      : [limit, ...DEFAULT_PAGE_SIZES].sort((a, b) => a - b);

    const pages = getPageNumbers(page, totalPages);

    return {
      ok: true,
      listings,
      pagination: { page, totalPages, hasMore, limit, total },
      pageSizeOptions,
      pages,
    };
  } catch (error) {
    logger.error('Search execution failed', error, {
      component: 'search.dal',
    });
    return { ok: false, reason: 'exception' };
  }
}

/**
 * Get search page data combining facets and initial results
 * This is a convenience function for the search page
 *
 * @param searchParams - The search parameters
 * @returns Combined facets and search results
 */
export async function getSearchPageData(searchParams: SearchParamRecord): Promise<{
  facets: SearchFacets;
  results: SearchFetchResult;
}> {
  // Fetch facets and results in parallel
  const [facets, results] = await Promise.all([
    getSearchFacets(),
    executeSearch(searchParams),
  ]);

  return { facets, results };
}
