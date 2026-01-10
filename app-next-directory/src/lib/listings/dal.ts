import type { Collection, Filter } from 'mongodb';
import { cacheLife, cacheTag, unstable_cache } from 'next/cache';
import { groq } from 'next-sanity';
import { cache } from 'react';
import { transformToDetailDTO } from '@/lib/dto-transformer';
import { structuredLogger as logger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import type { CityDTO, ListingDetailDTO } from '@/types/dto';
import type { SanityListing } from '@/types/sanity.types';
import { getCollection } from '@/utils/db-helpers';

const isBuildMode = process.env.NEXT_BUILD_MODE === 'true';

type RelatedListingRecord = {
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
};

export type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
    image?: string;
    id?: string;
  };
  status: 'pending' | 'approved';
};

type ReviewDocument = {
  _id?: string;
  id?: string;
  rating?: number | string;
  comment?: string | null;
  createdAt?: string | Date | null;
  _createdAt?: string | Date | null;
  status?: string | null;
  listingSlug?: string | null;
  user?:
    | string
    | {
        id?: string | null;
        _id?: string | null;
        name?: string | null;
        image?: string | null;
      }
    | null;
};

const DEFAULT_REVIEWS_LIMIT = 10;

const LISTING_QUERY = groq`*[_type == "listing" && moderation.status == "published" && slug.current == $slug][0]{
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

const RELATED_QUERY = groq`*[_type == "listing" && moderation.status == "published" && city._ref == $cityId && _id != $excludeId][0...6]{
    _id,
    name,
    "slug": slug.current,
    priceRange,
    "imageUrl": coalesce(primaryImage.asset->url, ""),
    ecoFocusTags[]->{ name },
    city->{ _id, name, country, "slug": slug.current }
}`;

const FAVORITE_QUERY = groq`*[_type == "userFavorite" && user._ref == $userId && listing._ref == $listingId][0]{ _id }`;

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
        component: 'listings/dal',
      });
      return null;
    }
    logger.error('Sanity fetch failed', {
      component: 'listings/dal',
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
    if (typeof tag === 'string' && tag.trim().length > 0) {
      names.push(tag);
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

export const fetchListingBySlug = cache(async (slug: string): Promise<ListingDetailDTO | null> => {
  'use cache';
  cacheLife('max');
  cacheTag(`listing-${slug}`);
  try {
    const raw = await fetchFromSanity<SanityListing | null>(LISTING_QUERY, { slug });
    if (!raw) return null;
    try {
      return transformToDetailDTO(raw);
    } catch (e) {
      logger.error('Failed to transform listing payload', e, {
        slug,
        component: 'listings/dal',
      });
      return null;
    }
  } catch (error) {
    logger.error('Failed to fetch listing details', error, {
      component: 'listings/dal',
      slug,
    });
    return null;
  }
});

export async function fetchRelatedListings(cityId?: string, excludeId?: string) {
  if (!cityId)
    return [] as Array<{
      id: string;
      name: string;
      slug: string;
      imageUrl: string;
      city: string | CityDTO | null;
      priceRange: 'budget' | 'moderate' | 'premium';
      ecoFocusTags: string[];
    }>;
  try {
    const records = await fetchFromSanity<RelatedListingRecord[]>(RELATED_QUERY, {
      cityId,
      excludeId,
    });
    if (!records) return [];
    return records
      .filter(record => record._id && record.name && record.slug)
      .map(record => {
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
      component: 'listings/dal',
      cityId,
      excludeId,
    });
    return [];
  }
}

export async function fetchReviews(listingSlug: string, userId?: string): Promise<Review[]> {
  try {
    const collection = (await getCollection('reviews')) as Collection<ReviewDocument>;

    const filter: Filter<ReviewDocument> = { listingSlug };
    if (userId) {
      filter.$or = [
        { status: 'approved' },
        { status: 'pending', user: userId },
        { status: 'pending', 'user.id': userId },
        { status: 'pending', 'user._id': userId },
      ];
    } else {
      filter.status = 'approved';
    }

    const documents = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(DEFAULT_REVIEWS_LIMIT)
      .toArray();

    const reviews: Review[] = [];

    for (const review of documents) {
      const id =
        typeof review?.id === 'string'
          ? review.id
          : typeof review?._id === 'string'
            ? review._id
            : null;

      const rating = Number((review as ReviewDocument)?.rating);
      const MAX_RATING = 5;
      if (!id || !Number.isFinite(rating) || rating <= 0 || rating > MAX_RATING) {
        continue;
      }

      const status = review?.status === 'pending' ? 'pending' : 'approved';
      const comment = typeof review?.comment === 'string' ? review.comment : '';
      const createdAtValue = (() => {
        const createdAt = review?.createdAt;
        const createdAtFallback = review?._createdAt;

        if (createdAt instanceof Date) return createdAt.toISOString();
        if (typeof createdAt === 'string') return createdAt;
        if (createdAtFallback instanceof Date) return createdAtFallback.toISOString();
        if (typeof createdAtFallback === 'string') return createdAtFallback;
        return new Date().toISOString();
      })();

      const rawUser = review?.user;
      let userName = 'Anonymous';
      let userImage: string | undefined;
      let mappedUserId: string | undefined;

      if (typeof rawUser === 'string') {
        mappedUserId = rawUser;
      } else if (rawUser && typeof rawUser === 'object') {
        const maybeName = typeof rawUser.name === 'string' ? rawUser.name.trim() : '';
        if (maybeName) {
          userName = maybeName;
        }
        const maybeImage = typeof rawUser.image === 'string' ? rawUser.image : undefined;
        userImage = maybeImage && maybeImage.length > 0 ? maybeImage : undefined;
        mappedUserId =
          typeof rawUser.id === 'string'
            ? rawUser.id
            : typeof rawUser._id === 'string'
              ? rawUser._id
              : undefined;
      }

      reviews.push({
        id,
        rating,
        comment,
        createdAt: createdAtValue,
        status,
        user: { name: userName, image: userImage, id: mappedUserId },
      });
    }

    return reviews;
  } catch (error) {
    logger.error('Failed to fetch listing reviews', error, {
      component: 'listings/dal',
      listingSlug,
      userId,
    });
    return [];
  }
}

const checkFavoritedCache = unstable_cache(
  async (listingId: string, userId: string) => {
    try {
      const favorite = await fetchFromSanity<{ _id?: string | null } | null>(FAVORITE_QUERY, {
        userId,
        listingId,
      });
      return Boolean(favorite?._id);
    } catch (error) {
      logger.error('Failed to check favorite status', error, {
        component: 'listings/dal',
        listingId,
        userId,
      });
      return false;
    }
  },
  ['user-favorite'],
  {
    revalidate: 60, // add appropriate revalidation time
  }
);

export async function checkIsFavorited(listingId: string, userId?: string): Promise<boolean> {
  if (!userId) return false;

  return checkFavoritedCache(listingId, userId);
}
