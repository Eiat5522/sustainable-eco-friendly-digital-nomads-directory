import { groq } from 'next-sanity';
import { cache } from 'react';
import {
  getE2ECityDetail,
  getE2ECityList,
  getE2ECitySummary,
  getE2EListingsForCity,
  isE2ERun,
} from '@/data/e2e/discovery-fixtures';
import type { DereferencedSanityListing } from '@/lib/dto-transformer';
import { transformToSummaryDTO } from '@/lib/dto-transformer';
import { cachedClient } from '@/lib/sanity/cached-client';
import type { CityDetailDTO, CityDTO, ListingSummaryDTO } from '@/types/dto';

type SanityImageDimensions = { width?: number; height?: number };
type SanityImageAsset = { url?: string; metadata?: { dimensions?: SanityImageDimensions } };
type SanityImageRef = { asset?: SanityImageAsset } | null | undefined;

// Input shape for dereferenced Sanity data from GROQ queries
interface ListingSummarySource {
  _id: string;
  name: string;
  // Projected as string in the GROQ query ("slug": slug.current)
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
    // Projected as string in the GROQ query ("slug": slug.current)
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

// Map raw Sanity city to CityDTO
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

// Map raw Sanity city to CityDetailDTO (extends CityDTO with additional fields)
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

export const getCityBySlug = cache(async (slug: string): Promise<CityDTO | null> => {
  if (isE2ERun()) {
    return getE2ECitySummary(slug);
  }
  const getCitySummaryBySlugQuery = groq`*[_type == "city" && slug.current == $slug][0]{
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

  const raw = await cachedClient.fetch<SanityCitySummary | null>(getCitySummaryBySlugQuery, {
    slug,
  });
  return toCityDTO(raw);
});

export const getCityDetailBySlug = cache(async (slug: string): Promise<CityDetailDTO | null> => {
  if (isE2ERun()) {
    return getE2ECityDetail(slug);
  }
  const getCityFullDetailsBySlugQuery = groq`*[_type == "city" && slug.current == $slug][0]{
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

  const raw = await cachedClient.fetch<SanityCityDetail | null>(getCityFullDetailsBySlugQuery, {
    slug,
  });
  return toCityDetailDTO(raw);
});

export const getListingsByCityId = cache(async (cityId: string): Promise<ListingSummaryDTO[]> => {
  if (isE2ERun()) {
    return getE2EListingsForCity(cityId);
  }
  const getPublishedListingsInCityQuery = groq`*[_type == "listing" && moderation.status == "published" && city._ref == $cityId]{
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

  const listingsRaw = await cachedClient.fetch<ListingSummarySource[]>(
    getPublishedListingsInCityQuery,
    { cityId }
  );

  return listingsRaw.map((listing: ListingSummarySource) =>
    transformToSummaryDTO({
      ...listing,
      slug: { current: listing.slug },
      city: listing.city ? { ...listing.city, slug: { current: listing.city.slug } } : undefined,
    } as DereferencedSanityListing)
  );
});

export const getCitiesList = cache(async (limit = 20): Promise<CityDTO[]> => {
  if (isE2ERun()) {
    return getE2ECityList(limit);
  }
  const getAllCitiesPaginatedQuery = groq`*[_type == "city"] | order(_createdAt desc)[0...$limit]{
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

  const raw = await cachedClient.fetch(getAllCitiesPaginatedQuery, { limit });
  return ((Array.isArray(raw) ? raw : []) as SanityCitySummary[])
    .map(toCityDTO)
    .filter(Boolean) as CityDTO[];
});

/**
 * Get all city slugs for static generation
 * This function is used by generateStaticParams in city pages
 */
export const getAllCitySlugs = cache(async (): Promise<string[]> => {
  if (isE2ERun()) {
    // Return E2E test fixture slugs
    const cities = getE2ECityList(100);
    return cities.map(city => city.slug);
  }

  const getAllCitySlugsQuery = groq`*[_type == "city"].slug.current`;

  const slugs = await cachedClient.fetch<string[]>(getAllCitySlugsQuery);
  return Array.isArray(slugs)
    ? slugs.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
    : [];
});
