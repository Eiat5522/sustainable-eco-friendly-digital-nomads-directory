/**
 * Cities Page Data Access Layer (DAL)
 *
 * Centralizes all city page data fetching with Next.js 16 caching.
 * Uses 'use cache' directive with appropriate cacheLife and cacheTag
 * for optimal static generation and revalidation.
 *
 * Design principles:
 * - Single source of truth for city page data operations
 * - Uses 'use cache' for long-lived static content
 * - Type-safe: no `any` types
 * - Testable: can be mocked for unit tests
 */

import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { groq } from 'next-sanity';
import {
  getE2ECityDetail,
  getE2ECityList,
  getE2ECitySummary,
  getE2EListingsForCity,
  isE2ERun,
} from '@/data/e2e/discovery-fixtures';
import type { DereferencedSanityListing } from '@/lib/dto-transformer';
import { transformToSummaryDTO } from '@/lib/dto-transformer';
import { sanityFetch } from '@/lib/sanity/client';
import type { CityDetailDTO, CityDTO, ListingSummaryDTO } from '@/types/dto';

// ============================================================================
// Internal Types
// ============================================================================

type SanityImageDimensions = { width?: number; height?: number };
type SanityImageAsset = { url?: string; metadata?: { dimensions?: SanityImageDimensions } };
type SanityImageRef = { asset?: SanityImageAsset } | null | undefined;

interface ListingSummarySource {
  _id: string;
  name: string;
  slug: string;
  type: 'coworking' | 'cafe' | 'accommodation' | 'restaurant' | 'activities';
  shortDescription?: string;
  address?: string;
  location?: { lat: number; lng: number };
  priceRange?: 'budget' | 'moderate' | 'premium';
  website?: string;
  primaryImage?: SanityImageRef;
  galleryImages?: SanityImageRef[];
  ecoFocusTags?: Array<{ name: string }>;
  digitalNomadFeatures?: Array<{ name: string }>;
  amenities?: Array<{ name: string }>;
  city?: {
    _id: string;
    name: string;
    country: string;
    sustainabilityScore?: number;
    highlights?: string[];
    slug: string;
  };
}

type StringOrNamedValue = string | { name?: string | null } | null | undefined;

type SanityCitySummary = {
  _id?: string;
  name?: string;
  slug?: string;
  country?: string;
  sustainabilityScore?: number;
  highlights?: unknown;
  primaryImage?: SanityImageRef;
  description?: string;
};

type SanityCityDetail = SanityCitySummary & {
  shortDescription?: string;
  airQuality?: string;
  internetSpeed?: number;
  costOfLiving?: string;
  climate?: string;
  safety?: string;
  walkability?: string;
  sustainabilityInitiatives?: StringOrNamedValue[];
  digitalNomadFeatures?: StringOrNamedValue[];
  galleryImages?: SanityImageRef[];
};

// ============================================================================
// GROQ Queries
// ============================================================================

const GET_CITY_SUMMARY_BY_SLUG_QUERY = groq`*[_type == "city" && slug.current == $slug][0]{
  _id,
  name,
  "slug": slug.current,
  country,
  sustainabilityScore,
  highlights,
  description,
  "primaryImage": primaryImage{
    asset->{
      url,
      metadata{ dimensions }
    }
  }
}`;

const GET_CITY_FULL_DETAILS_BY_SLUG_QUERY = groq`*[_type == "city" && slug.current == $slug][0]{
  _id,
  name,
  "slug": slug.current,
  country,
  sustainabilityScore,
  highlights,
  description,
  shortDescription,
  airQuality,
  internetSpeed,
  costOfLiving,
  climate,
  safety,
  walkability,
  sustainabilityInitiatives,
  digitalNomadFeatures,
  galleryImages[]{
    asset->{
      url
    }
  },
  "primaryImage": primaryImage{
    asset->{
      url,
      metadata{ dimensions }
    }
  }
}`;

const GET_PUBLISHED_LISTINGS_IN_CITY_QUERY = groq`*[_type == "listing" && moderation.status == "published" && city._ref == $cityId]{
  _id,
  name,
  "slug": slug.current,
  type,
  shortDescription,
  address,
  location,
  priceRange,
  website,
  primaryImage{
    asset->{
      url,
      metadata{ dimensions }
    }
  },
  "galleryImages": galleryImages[]{
    asset->{
      url
    }
  },
  ecoFocusTags[]->{ name },
  digitalNomadFeatures[]->{ name },
  amenities[]->{ name },
  city->{
    _id,
    name,
    country,
    sustainabilityScore,
    highlights,
    "slug": slug.current
  }
}`;

const GET_ALL_CITY_SLUGS_QUERY = groq`*[_type == "city"].slug.current`;

const GET_ALL_CITIES_PAGINATED_QUERY = groq`*[_type == "city"] | order(_createdAt desc)[0...$limit]{
  _id,
  name,
  "slug": slug.current,
  country,
  sustainabilityScore,
  highlights,
  description,
  "primaryImage": primaryImage{
    asset->{
      url,
      metadata{ dimensions }
    }
  }
}`;

// ============================================================================
// Internal Helpers
// ============================================================================

const normaliseNamedValues = (values?: StringOrNamedValue[]): string[] =>
  Array.isArray(values)
    ? values
        .map(value => {
          if (typeof value === 'string') {
            return value;
          }
          return typeof value?.name === 'string' ? value.name : undefined;
        })
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    : [];

const resolveImageDimensions = (dimensions?: SanityImageDimensions | null) => {
  if (!dimensions) {
    return undefined;
  }

  const width =
    typeof dimensions.width === 'number' && Number.isFinite(dimensions.width)
      ? dimensions.width
      : undefined;
  const height =
    typeof dimensions.height === 'number' && Number.isFinite(dimensions.height)
      ? dimensions.height
      : undefined;

  if (width === undefined && height === undefined) {
    return undefined;
  }

  return { width, height };
};

// ============================================================================
// Mappers
// ============================================================================

/**
 * Map raw Sanity city to CityDTO
 */
function toCityDTO(raw: SanityCitySummary | null | undefined): CityDTO | null {
  if (!raw || typeof raw !== 'object') return null;
  const sustainability =
    typeof raw.sustainabilityScore === 'number'
      ? Math.max(0, Math.min(100, raw.sustainabilityScore))
      : undefined;

  const dimensions = resolveImageDimensions(raw.primaryImage?.asset?.metadata?.dimensions ?? null);

  const highlights = Array.isArray(raw.highlights)
    ? (raw.highlights.filter((item): item is string => typeof item === 'string') as string[])
    : [];

  if (!raw._id || !raw.name || !raw.slug) {
    return null;
  }

  return {
    id: raw._id,
    name: raw.name,
    slug: raw.slug,
    country: raw.country ?? '',
    sustainabilityScore: sustainability as CityDTO['sustainabilityScore'],
    highlights,
    imageUrl: raw.primaryImage?.asset?.url ?? undefined,
    imageDimensions: dimensions,
    description: raw.description ?? undefined,
  };
}

/**
 * Map raw Sanity city to CityDetailDTO (extends CityDTO with additional fields)
 */
function toCityDetailDTO(raw: SanityCityDetail | null | undefined): CityDetailDTO | null {
  if (!raw || typeof raw !== 'object') return null;

  const baseCity = toCityDTO(raw);
  if (!baseCity) return null;

  const galleryUrls: string[] = Array.isArray(raw.galleryImages)
    ? raw.galleryImages
        .map(img => (typeof img?.asset?.url === 'string' ? img.asset.url : undefined))
        .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    : [];

  return {
    ...baseCity,
    shortDescription: raw.shortDescription ?? undefined,
    airQuality: raw.airQuality ?? undefined,
    internetSpeed: typeof raw.internetSpeed === 'number' ? raw.internetSpeed : undefined,
    costOfLiving: raw.costOfLiving ?? undefined,
    climate: raw.climate ?? undefined,
    safety: raw.safety ?? undefined,
    walkability: raw.walkability ?? undefined,
    sustainabilityInitiatives: normaliseNamedValues(raw.sustainabilityInitiatives),
    digitalNomadFeatures: normaliseNamedValues(raw.digitalNomadFeatures),
    galleryImages: galleryUrls,
  };
}

// ============================================================================
// Public DAL Functions
// ============================================================================

/**
 * Get city summary by slug
 * Uses 'use cache' with cacheLife('max') for long-lived static content
 *
 * @param slug - City slug
 * @returns CityDTO or null if not found
 */
export async function getCityBySlug(slug: string): Promise<CityDTO | null> {
  'use cache';
  cacheLife('max');
  cacheTag('cities:list', `city:${slug}`);

  if (isE2ERun()) {
    return getE2ECitySummary(slug);
  }

  const raw = (await sanityFetch({
    query: GET_CITY_SUMMARY_BY_SLUG_QUERY,
    params: { slug },
    revalidate: 60 * 60 * 24 * 7, // 1 week
    tags: [`cities:list`, `city:${slug}`],
  })) as SanityCitySummary | null;

  return toCityDTO(raw);
}

/**
 * Get detailed city information by slug
 * Uses 'use cache' with cacheLife('max') for long-lived static content
 *
 * @param slug - City slug
 * @returns CityDetailDTO or null if not found
 */
export async function getCityDetailBySlug(slug: string): Promise<CityDetailDTO | null> {
  'use cache';
  cacheLife('max');
  cacheTag('cities:list', `city:${slug}`);

  if (isE2ERun()) {
    return getE2ECityDetail(slug);
  }

  const raw = (await sanityFetch({
    query: GET_CITY_FULL_DETAILS_BY_SLUG_QUERY,
    params: { slug },
    revalidate: 60 * 60 * 24 * 7, // 1 week
    tags: [`cities:list`, `city:${slug}`],
  })) as SanityCityDetail | null;

  return toCityDetailDTO(raw);
}

/**
 * Get all published listings for a city
 * Uses 'use cache' with cacheLife('max') for static content
 *
 * @param cityId - City ID
 * @returns Array of ListingSummaryDTO
 */
export async function getListingsByCityId(cityId: string): Promise<ListingSummaryDTO[]> {
  'use cache';
  cacheLife('max');
  cacheTag(`city:${cityId}`, 'listings');

  if (isE2ERun()) {
    return getE2EListingsForCity(cityId);
  }

  const listingsRaw = (await sanityFetch({
    query: GET_PUBLISHED_LISTINGS_IN_CITY_QUERY,
    params: { cityId },
    revalidate: 60 * 60 * 24 * 7, // 1 week
    tags: [`city:${cityId}`],
  })) as ListingSummarySource[];

  return listingsRaw.map((listing: ListingSummarySource) =>
    transformToSummaryDTO({
      ...listing,
      slug: { current: listing.slug },
      city: listing.city ? { ...listing.city, slug: { current: listing.city.slug } } : undefined,
    } as DereferencedSanityListing)
  );
}

/**
 * Get all city slugs for static generation
 * Uses 'use cache' with cacheLife('max') for build-time usage
 *
 * This function is used by generateStaticParams in city pages
 *
 * @returns Array of city slugs
 */
export async function getAllCitySlugs(): Promise<string[]> {
  'use cache';
  cacheLife('max');
  cacheTag('cities:list');

  if (isE2ERun()) {
    const cities = getE2ECityList(100);
    return cities.map(city => city.slug);
  }

  try {
    const slugs = (await sanityFetch({
      query: GET_ALL_CITY_SLUGS_QUERY,
      revalidate: 60 * 60 * 24 * 7, // 1 week
      tags: ['cities:list'],
    })) as string[];

    return Array.isArray(slugs)
      ? slugs.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
      : [];
  } catch (_error) {
    // During build time, Sanity may not be available
    // Return empty array to allow build to proceed with fallback params
    return [];
  }
}

/**
 * Get all cities with pagination
 * Uses 'use cache' with cacheLife('max') for static content
 *
 * @param limit - Maximum number of cities to return
 * @returns Array of CityDTO
 */
export async function getCitiesList(limit = 20): Promise<CityDTO[]> {
  'use cache';
  cacheLife('max');
  cacheTag('cities:list');

  if (isE2ERun()) {
    return getE2ECityList(limit);
  }

  const raw = (await sanityFetch({
    query: GET_ALL_CITIES_PAGINATED_QUERY,
    params: { limit },
    revalidate: 60 * 60 * 24 * 7, // 1 week
    tags: ['cities:list'],
  })) as unknown;

  return (Array.isArray(raw) ? raw : []).map(toCityDTO).filter(Boolean) as CityDTO[];
}
