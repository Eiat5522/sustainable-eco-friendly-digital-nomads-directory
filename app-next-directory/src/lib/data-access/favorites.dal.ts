/**
 * Favorites Data Access Layer (DAL)
 *
 * Centralizes all user favorites-related data fetching and caching operations.
 * Follows Next.js 16 best practices with 'use cache: private' for user-specific data.
 *
 * Design principles:
 * - Single source of truth for favorites operations
 * - Uses 'use cache: private' for user-specific caching
 * - Type-safe: no `any` types
 * - Testable: can be mocked for unit tests
 */

import 'server-only';

import type { Collection, Filter } from 'mongodb';
import { cacheLife, cacheTag } from 'next/cache';
import { cookies } from 'next/headers';
import { groq } from 'next-sanity';
import { structuredLogger as logger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import { getCollection } from '@/utils/db-helpers';

// ============================================================================
// GROQ Queries
// ============================================================================

const FAVORITE_CHECK_QUERY = groq`*[_type == "userFavorite" && user._ref == $userId && listing._ref == $listingId][0]{ _id }`;

// ============================================================================
// Types
// ============================================================================

export interface ReviewDocument {
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
}

export interface Review {
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
        component: 'favorites.dal',
      });
      return null;
    }
    logger.error('Sanity fetch failed', {
      component: 'favorites.dal',
      error: err,
    });
    throw err;
  }
}

const DEFAULT_REVIEWS_LIMIT = 10;

// ============================================================================
// Public DAL Functions
// ============================================================================

/**
 * Check if a listing is favorited by the current user
 * Uses 'use cache: private' for user-specific caching with cookies access
 *
 * @param listingId - The listing ID to check
 * @param userId - The user ID (from session)
 * @returns boolean indicating if the listing is favorited
 */
export async function checkIsFavorited(
  listingId: string,
  userId?: string
): Promise<boolean> {
  'use cache: private';
  cacheLife({ stale: 60 }); // Cache for 60 seconds per user

  if (!userId) return false;

  // Access cookies within private cache (allowed with 'use cache: private')
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    // If there's no session cookie, the user isn't authenticated
    if (!sessionCookie) return false;
  } catch {
    // If cookies() throws (e.g., during static generation), return false
    return false;
  }

  cacheTag(`user-${userId}-favorite-${listingId}`);

  try {
    const favorite = await fetchFromSanity<{ _id?: string | null } | null>(
      FAVORITE_CHECK_QUERY,
      { userId, listingId }
    );
    return Boolean(favorite?._id);
  } catch (error) {
    logger.error('Failed to check favorite status', error, {
      component: 'favorites.dal',
      listingId,
      userId,
    });
    return false;
  }
}

/**
 * Fetch reviews for a listing
 * Public reviews are cached, user-specific pending reviews use private cache
 *
 * @param listingSlug - The listing slug
 * @param userId - Optional user ID for seeing own pending reviews
 * @returns Array of reviews
 */
export async function getListingReviews(
  listingSlug: string,
  userId?: string
): Promise<Review[]> {
  'use cache';
  cacheLife({ stale: 300 }); // Cache for 5 minutes
  cacheTag(`reviews-${listingSlug}`);

  try {
    const collection = (await getCollection('reviews')) as Collection<ReviewDocument>;

    const filter: Filter<ReviewDocument> = { listingSlug };
    if (userId) {
      filter.$or = [{ status: 'approved' }, { status: 'pending', user: userId }];
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
      if (!id || !Number.isFinite(rating) || rating <= 0) {
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
      component: 'favorites.dal',
      listingSlug,
      userId,
    });
    return [];
  }
}
