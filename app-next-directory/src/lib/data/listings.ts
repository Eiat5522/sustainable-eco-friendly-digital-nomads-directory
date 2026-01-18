import { groq } from 'next-sanity';
import { ALLOWED_CATEGORIES } from '@/lib/constants/categories';
import { imageOrFallback } from '@/lib/dto-transformer';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import type { ListingSummaryDTO } from '@/types/dto';

type ListingEcoTag = {
  name?: string | null;
};

type ListingCity = {
  _id: string;
  name: string;
  slug: string;
  country?: string | null;
};

type ListingRecord = {
  _id: string;
  name: string;
  slug: string;
  primaryImage?: unknown;
  city?: ListingCity | null;
  type?: string | null;
  priceRange?: string | null;
  ecoFocusTags?: Array<string | ListingEcoTag> | null;
};

const getEcoTagName = (tag: string | ListingEcoTag): string | null => {
  if (typeof tag === 'string') return tag;
  return tag.name ?? null;
};

const normalizeListingType = (value: string | null | undefined): ListingSummaryDTO['type'] => {
  if (value && ALLOWED_CATEGORIES.has(value as ListingSummaryDTO['type'])) {
    return value as ListingSummaryDTO['type'];
  }
  return 'activities';
};

const ALLOWED_PRICE_RANGES = ['budget', 'moderate', 'premium'] as const;
type PriceRange = (typeof ALLOWED_PRICE_RANGES)[number];

const normalizePriceRange = (value: string | null | undefined): PriceRange | undefined => {
  if (value && ALLOWED_PRICE_RANGES.includes(value as PriceRange)) {
    return value as PriceRange;
  }
  return undefined;
};

const toStringList = (values: Array<string | null | undefined>): string[] =>
  values.filter((v): v is string => typeof v === 'string' && v.length > 0);

const toSummaryDTO = (listing: ListingRecord): ListingSummaryDTO => ({
  id: listing._id,
  name: listing.name,
  slug: listing.slug,
  type: normalizeListingType(listing.type),
  city: listing.city
    ? {
        id: listing.city._id,
        name: listing.city.name,
        slug: listing.city.slug,
        country: listing.city.country ?? '',
      }
    : null,
  imageUrl: imageOrFallback(listing.primaryImage, 500, 300),
  ecoFocusTags: toStringList((listing.ecoFocusTags ?? []).map(getEcoTagName)),
  priceRange: normalizePriceRange(listing.priceRange),
});

export async function getAllListings(params: {
  search?: string | null;
  city?: string | null;
  type?: string | null;
  priceRange?: string | null;
  ecoTags?: string[] | null;
}) {
  try {
    // Use a static groq query to avoid complex template interpolation during build-time analysis.
    const query = groq`*[_type == "listing" && moderation.status == "published"]{ _id, name, "slug": slug.current, primaryImage, city->{_id, name, "slug": slug.current, country}, type, priceRange, ecoFocusTags[]->{name} }`;
    const results = (await client.fetch<ListingRecord[]>(query)) ?? [];

    // Apply light filters in JS to avoid dynamic groq composition at build time.
    const filtered = results.filter(r => {
      if (!r) return false;
      if (params.city && r.city?._id !== params.city) return false;
      if (params.type && r.type !== params.type) return false;
      if (params.priceRange && r.priceRange !== params.priceRange) return false;
      if (params.ecoTags && params.ecoTags.length > 0) {
        const tagNames = new Set(toStringList((r.ecoFocusTags ?? []).map(getEcoTagName)));
        if (!params.ecoTags.some(tag => tagNames.has(tag))) return false;
      }
      return true;
    });
    return filtered.map(toSummaryDTO);
  } catch (error: unknown) {
    structuredLogger.error('Failed to fetch listings', error, { component: 'listings', params });
    return [];
  }
}
