/**
 * Home Page Data Access Layer (DAL)
 *
 * Centralizes all home page data fetching with Next.js 16 caching.
 * Uses 'use cache' directive with appropriate cacheLife and cacheTag
 * for optimal static generation and revalidation.
 *
 * Design principles:
 * - Single source of truth for home page data operations
 * - Uses 'use cache' for long-lived static content
 * - Type-safe: no `any` types
 * - Testable: can be mocked for unit tests
 */

import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { groq } from 'next-sanity';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import type { CityDTO, FeaturedListingDTO, Percentage0To100 } from '@/types/dto';

// ============================================================================
// GROQ Queries
// ============================================================================

const FEATURED_LISTINGS_QUERY = groq`
  *[_type == "listing" && moderation.featured == true && moderation.status == "published"]
  | order(_createdAt desc)[0...$limit] {
    _id,
    name,
    "slug": slug.current,
    "primaryImage": primaryImage{
      ...,
      asset->
    },
    galleryImages[]{
      ...,
      asset->
    },
    location,
    "city": city->{
      _id,
      name,
      country
    }
  }
`;

const CITIES_QUERY = groq`
  *[_type == "city"] | order(_createdAt desc)[0...$limit] {
    _id,
    title,
    "slug": slug.current,
    country,
    description,
    sustainabilityScore,
    highlights,
    "primaryImage": primaryImage {
      asset->{
        _ref,
        _id,
        url,
        metadata {
          dimensions {
            width,
            height
          }
        }
      }
    }
  }
`;

const ECO_TAGS_QUERY = groq`
  *[_type == "ecoTag"] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    description
  }
`;

// ============================================================================
// Internal Types
// ============================================================================

interface SanityCityRecord {
  _id?: string;
  title?: string;
  slug?: string | { current?: string };
  country?: string;
  description?: string;
  sustainabilityScore?: number;
  highlights?: string[];
  primaryImage?: {
    asset?: {
      url?: string;
    };
  };
}

interface SanityFeaturedListingRecord {
  _id?: string;
  name?: string;
  slug?: string;
  primaryImage?: {
    asset?: {
      url?: string;
    };
  };
  city?:
    | {
        name?: string;
      }
    | string;
}

interface SanityEcoTagRecord {
  _id?: string;
  name?: string;
  slug?: string;
  description?: string;
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
    isBuildMode && client.withConfig ? client.withConfig({ maxRetries: 0 }) : client;
  try {
    return await fetchClient.fetch<T>(query, params);
  } catch (err: unknown) {
    if (isBuildMode && isPrerenderRejection(err)) {
      structuredLogger.warn('Sanity fetch rejected during prerender; using fallback', {
        component: 'home.dal',
      });
      return null;
    }
    structuredLogger.error('Sanity fetch failed', {
      component: 'home.dal',
      error: err,
    });
    throw err;
  }
}

// ============================================================================
// Mappers
// ============================================================================

const mapCityRecordToDTO = (city: SanityCityRecord): CityDTO | null => {
  const slugValue =
    typeof city.slug === 'string'
      ? city.slug
      : city.slug && typeof city.slug === 'object'
        ? city.slug.current
        : undefined;

  if (!city?._id || !city.title || !slugValue) {
    return null;
  }

  const imageUrl = city.primaryImage?.asset?.url ?? null;
  const highlights = Array.isArray(city.highlights)
    ? city.highlights.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : undefined;

  const sustainabilityScore =
    typeof city.sustainabilityScore === 'number' &&
    city.sustainabilityScore >= 0 &&
    city.sustainabilityScore <= 100
      ? (city.sustainabilityScore as Percentage0To100)
      : undefined;

  return {
    id: city._id,
    name: city.title,
    slug: slugValue,
    country: city.country ?? '',
    description: city.description,
    sustainabilityScore,
    highlights,
    imageUrl,
  };
};

/**
 * Maps a Sanity featured listing record to a FeaturedListingDTO.
 *
 * Note: `amenityNames` is intentionally returned as an empty array for home page
 * featured listings. The home page carousel displays minimal listing info (name,
 * image, city) for performance; amenities are not shown and are omitted from the
 * GROQ query to reduce payload size. Full amenity data is fetched in the listing
 * detail page via `listing.dal.ts` -> `getListingBySlug()`.
 */
const mapFeaturedListingRecordToDTO = (
  listing: SanityFeaturedListingRecord
): FeaturedListingDTO | null => {
  if (!listing?._id || !listing.name || !listing.slug) {
    return null;
  }

  const city = typeof listing.city === 'string' ? listing.city : (listing.city?.name ?? '');

  return {
    id: listing._id,
    name: listing.name,
    slug: listing.slug,
    imageUrl: listing.primaryImage?.asset?.url,
    city,
    amenityNames: [], // Intentionally empty – see JSDoc above
  };
};

// ============================================================================
// Public DAL Functions
// ============================================================================

/**
 * Get featured listings for the home page carousel
 * Uses 'use cache' with cacheLife('max') for long-lived static content
 *
 * @param limit - Maximum number of listings to return
 * @returns Array of FeaturedListingDTO
 */
export async function getFeaturedListings(limit = 10): Promise<FeaturedListingDTO[]> {
  'use cache';
  cacheLife('max');
  cacheTag('featured-listings', 'home');

  try {
    const rawListings = await fetchFromSanity<SanityFeaturedListingRecord[]>(
      FEATURED_LISTINGS_QUERY,
      { limit }
    );

    if (!rawListings) return [];

    return rawListings
      .map(mapFeaturedListingRecordToDTO)
      .filter((listing): listing is FeaturedListingDTO => listing !== null);
  } catch (error) {
    structuredLogger.error('Failed to fetch featured listings', {
      component: 'home.dal',
      error,
      limit,
    });
    return [];
  }
}

/**
 * Get all cities for the city carousel
 * Uses 'use cache' with cacheLife('max') for static city data
 *
 * @param limit - Maximum number of cities to return (default: 8)
 * @returns Array of CityDTO
 */
export async function getCities(limit = 8): Promise<CityDTO[]> {
  'use cache';
  cacheLife('max');
  cacheTag('cities', 'home');

  try {
    const rawCities = await fetchFromSanity<SanityCityRecord[]>(CITIES_QUERY, { limit });

    if (!rawCities) return [];

    return rawCities.map(mapCityRecordToDTO).filter((city): city is CityDTO => city !== null);
  } catch (error) {
    structuredLogger.error('Failed to fetch cities', error, {
      component: 'home.dal',
      limit,
    });
    return [];
  }
}

/**
 * Get all eco tags for filtering and display
 * Uses 'use cache' with cacheLife('days') for relatively static data
 *
 * @returns Array of eco tags
 */
export async function getEcoTags(): Promise<
  Array<{ id: string; name: string; slug: string; description?: string }>
> {
  'use cache';
  cacheLife('days');
  cacheTag('eco-tags');

  try {
    const rawTags = await fetchFromSanity<SanityEcoTagRecord[]>(ECO_TAGS_QUERY);

    if (!rawTags) return [];

    return rawTags
      .filter(
        (
          tag
        ): tag is Required<Pick<SanityEcoTagRecord, '_id' | 'name' | 'slug'>> &
          SanityEcoTagRecord => Boolean(tag._id && tag.name && tag.slug)
      )
      .map(tag => ({
        id: tag._id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
      }));
  } catch (error) {
    structuredLogger.error('Failed to fetch eco tags', error, {
      component: 'home.dal',
    });
    return [];
  }
}

/**
 * Get home page data bundle - fetches all data needed for the home page
 * Uses parallel fetching for optimal performance
 *
 * @returns Object containing featuredListings and cities
 */
export async function getHomePageData(
  featuredListingsLimit = 10,
  citiesLimit = 8
): Promise<{
  featuredListings: FeaturedListingDTO[];
  cities: CityDTO[];
}> {
  'use cache';
  cacheLife('max');
  cacheTag('home', 'featured-listings', 'cities');

  const [featuredListings, cities] = await Promise.all([
    getFeaturedListings(featuredListingsLimit),
    getCities(citiesLimit),
  ]);

  return {
    featuredListings,
    cities,
  };
}
