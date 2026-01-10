/**
 * Listings Data Access Layer (DAL)
 *
 * Centralizes all listing-related data fetching and caching operations.
 * Follows Next.js 16 best practices for Cache Components.
 *
 * Design principles:
 * - Single source of truth for listing data operations
 * - Type-safe: no `any` types
 * - Cacheable: uses 'use cache' directive with proper tags
 * - Testable: can be mocked for unit tests
 */

import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { groq } from 'next-sanity';
import { cache } from 'react';
import { transformToDetailDTO } from '@/lib/dto-transformer';
import { structuredLogger as logger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import type { CityDTO, ListingDetailDTO } from '@/types/dto';
import type { SanityListing } from '@/types/sanity.types';

// ============================================================================
// GROQ Queries
// ============================================================================

const LISTING_DETAIL_QUERY = groq`*[_type == "listing" && moderation.status == "published" && slug.current == $slug][0]{
  _id,
  name,
  "slug": slug.current,
  type,
  shortDescription,
  longDescription,
  address,
  location,
  website,
  priceRange,
  contactPhone,
  contactEmail,
  primaryImage,
  galleryImages,
  ecoFocusTags[]->{ _id, name, slug },
  digitalNomadFeatures[]->{ _id, name, slug },
  amenities[]->{ _id, name, slug, icon, category },
  city->{ _id, name, country, sustainabilityScore, highlights, "slug": slug.current },
  coworkingDetails,
  cafeDetails,
  restaurantDetails,
  activitiesDetails,
  accommodationDetails,
  moderation
}`;

const RELATED_LISTINGS_QUERY = groq`*[_type == "listing" && moderation.status == "published" && city._ref == $cityId && _id != $excludeId][0...6]{
  _id,
  name,
  "slug": slug.current,
  priceRange,
  "imageUrl": coalesce(primaryImage.asset->url, ""),
  ecoFocusTags[]->{ name },
  city->{ _id, name, country, "slug": slug.current }
}`;

const POPULAR_LISTINGS_SLUGS_QUERY = groq`*[_type == "listing" && moderation.status == "published" && defined(popular) && popular == true][0...50]{ "slug": slug.current }`;

const FALLBACK_LISTINGS_SLUGS_QUERY = groq`*[_type == "listing" && moderation.status == "published"][0...1]{ "slug": slug.current }`;

// ============================================================================
// Types
// ============================================================================

export interface RelatedListingRecord {
  _id?: string | null;
  name?: string | null;
  slug?: string | null;
  priceRange?: string | null;
  imageUrl?: string | null;
  city?: {
    _id?: string | null;
    name?: string | null;
    country?: string | null;
    slug?: string | null;
  } | null;
  ecoFocusTags?: Array<{ name?: string | null } | string | null | undefined> | null;
}

export interface RelatedListingDTO {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  city: CityDTO | null;
  priceRange: 'budget' | 'moderate' | 'premium';
  ecoFocusTags: string[];
}

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
        component: 'listings.dal',
      });
      return null;
    }
    logger.error('Sanity fetch failed', {
      component: 'listings.dal',
      error: err,
    });
    throw err;
  }
}

function isPriceRange(
  value: string | null | undefined
): value is 'budget' | 'moderate' | 'premium' {
  return value === 'budget' || value === 'moderate' || value === 'premium';
}

function extractTagNames(tags?: RelatedListingRecord['ecoFocusTags']): string[] {
  if (!Array.isArray(tags)) return [];
  const names: string[] = [];
  for (const tag of tags) {
    if (typeof tag === 'string') {
      structuredLogger.warn('Unexpected string tag encountered in ecoFocusTags', {
        component: 'listings.dal',
        tag,
      });
      continue;
    }
    if (
      tag &&
      typeof tag === 'object' &&
      typeof tag.name === 'string' &&
      tag.name.trim().length > 0
    ) {
      names.push(tag.name.trim());
    }
  }
  return names;
}

function mapCityRecordToDTO(city?: RelatedListingRecord['city']): CityDTO | null {
  if (!city || !city._id || !city.name || !city.country || !city.slug) {
    return null;
  }
  return {
    id: city._id,
    name: city.name,
    slug: city.slug,
    country: city.country,
  };
}

// ============================================================================
// Public DAL Functions
// ============================================================================

/**
 * Fetch a single listing by slug with full caching support
 * Uses 'use cache' with cacheLife('max') for optimal static performance
 *
 * @param slug - The listing slug
 * @returns ListingDetailDTO or null if not found
 */
export const getListingBySlug = cache(async (slug: string): Promise<ListingDetailDTO | null> => {
  'use cache';
  cacheLife('max');
  cacheTag(`listing-${slug}`);

  try {
    const raw = await fetchFromSanity<SanityListing | null>(LISTING_DETAIL_QUERY, { slug });
    if (!raw) return null;

    try {
      return transformToDetailDTO(raw);
    } catch (e) {
      logger.error('Failed to transform listing payload', e, {
        slug,
        component: 'listings.dal',
      });
      return null;
    }
  } catch (error) {
    logger.error('Failed to fetch listing details', error, {
      component: 'listings.dal',
      slug,
    });
    return null;
  }
});

/**
 * Fetch related listings for a given city
 *
 * @param cityId - The city reference ID
 * @param excludeId - The current listing ID to exclude
 * @returns Array of related listing DTOs
 */
export async function getRelatedListings(
  cityId?: string,
  excludeId?: string
): Promise<RelatedListingDTO[]> {
  'use cache';
  cacheLife('max');
  if (cityId) {
    cacheTag(`related-listings-${cityId}`);
  }

  if (!cityId) return [];

  try {
    const records = await fetchFromSanity<RelatedListingRecord[]>(RELATED_LISTINGS_QUERY, {
      cityId,
      excludeId,
    });
    if (!records) return [];

    return records.map(record => {
      const priceRange = isPriceRange(record.priceRange) ? record.priceRange : 'moderate';

      return {
        id: record._id ?? '',
        name: record.name ?? '',
        slug: record.slug ?? '',
        imageUrl: record.imageUrl ?? '',
        city: mapCityRecordToDTO(record.city),
        priceRange,
        ecoFocusTags: extractTagNames(record.ecoFocusTags),
      };
    });
  } catch (error) {
    logger.error('Failed to fetch related listings', error, {
      component: 'listings.dal',
      cityId,
      excludeId,
    });
    return [];
  }
}

/**
 * Get slugs for popular listings (for static generation)
 *
 * @returns Array of slug objects
 */
export async function getPopularListingSlugs(): Promise<Array<{ slug: string }>> {
  try {
    const popularSlugs = await fetchFromSanity<Array<{ slug: string }>>(
      POPULAR_LISTINGS_SLUGS_QUERY
    );

    if (popularSlugs && popularSlugs.length > 0) {
      return popularSlugs.map(item => ({ slug: item.slug }));
    }

    // Fallback: return the first published listing to satisfy Cache Components requirement
    const fallbackListings = await fetchFromSanity<Array<{ slug: string }>>(
      FALLBACK_LISTINGS_SLUGS_QUERY
    );

    if (fallbackListings && fallbackListings.length > 0) {
      return fallbackListings.map(item => ({ slug: item.slug }));
    }

    // If no listings exist at all, return a placeholder
    return [{ slug: 'placeholder-listing' }];
  } catch (error) {
    logger.error('Failed to generate static params for listings', error, {
      component: 'listings.dal',
    });
    return [{ slug: 'placeholder-listing' }];
  }
}
