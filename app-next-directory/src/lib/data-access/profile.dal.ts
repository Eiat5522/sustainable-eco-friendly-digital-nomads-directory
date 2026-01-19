/**
 * Profile Data Access Layer (DAL)
 *
 * Centralizes profile-specific data fetching for Cache Components.
 * Uses private caching for user-scoped data.
 */

import 'server-only';

import type { Collection } from 'mongodb';
import { cacheLife, cacheTag } from 'next/cache';
import { getUserDashboardData } from '@/lib/dashboard/user-dashboard';
import { structuredLogger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';
import { getCollection } from '@/utils/db-helpers';

type SessionUser = {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string | null;
};

type ListingDoc = {
  slug?: unknown;
  name?: unknown;
  ownerId?: unknown;
  status?: unknown;
};

type ReviewDoc = {
  _id?: unknown;
  listingSlug?: unknown;
  rating?: unknown;
  comment?: unknown;
  createdAt?: unknown;
  userName?: unknown;
  userImage?: unknown;
  user?: {
    name?: unknown;
    image?: unknown;
  } | null;
};

export type OwnerListingReview = {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewerName: string;
  reviewerImage?: string;
};

export type OwnerListingReviews = {
  slug: string;
  name: string;
  reviews: OwnerListingReview[];
};

function normaliseSlug(rawSlug: unknown): string | null {
  if (typeof rawSlug === 'string' && rawSlug.trim().length > 0) {
    return rawSlug.trim();
  }

  if (
    rawSlug &&
    typeof rawSlug === 'object' &&
    'current' in rawSlug &&
    typeof (rawSlug as { current?: unknown }).current === 'string'
  ) {
    const slug = (rawSlug as { current?: string }).current ?? '';
    return slug.trim().length > 0 ? slug.trim() : null;
  }

  return null;
}

function normaliseListing(doc: ListingDoc): { slug: string; name: string } | null {
  const slug = normaliseSlug(doc.slug);
  if (!slug) {
    return null;
  }

  const name =
    typeof doc.name === 'string' && doc.name.trim().length > 0
      ? doc.name.trim()
      : 'Untitled listing';

  return { slug, name };
}

function normaliseReview(doc: ReviewDoc): OwnerListingReview | null {
  const ratingNumber = Number(doc.rating);
  if (!Number.isFinite(ratingNumber) || ratingNumber <= 0) {
    return null;
  }

  const comment = typeof doc.comment === 'string' ? doc.comment : undefined;
  let createdAt: string;
  try {
    createdAt =
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : typeof doc.createdAt === 'string' && doc.createdAt.trim().length > 0
          ? new Date(doc.createdAt).toISOString()
          : new Date().toISOString();
  } catch {
    createdAt = new Date().toISOString();
  }

  let reviewerName: string | undefined;
  if (typeof doc.userName === 'string' && doc.userName.trim().length > 0) {
    reviewerName = doc.userName.trim();
  } else if (doc.user && typeof doc.user.name === 'string' && doc.user.name.trim().length > 0) {
    reviewerName = doc.user.name.trim();
  }
  const reviewerImage =
    typeof doc.userImage === 'string' && doc.userImage.trim().length > 0
      ? doc.userImage.trim()
      : doc.user && typeof doc.user.image === 'string' && doc.user.image.trim().length > 0
        ? doc.user.image.trim()
        : undefined;

  const id =
    typeof doc._id === 'string'
      ? doc._id
      : doc._id && typeof doc._id === 'object' && 'toString' in doc._id
        ? String((doc._id as { toString: () => string }).toString())
        : null;

  if (!id) {
    return null;
  }

  return {
    id,
    rating: ratingNumber,
    comment,
    createdAt,
    reviewerName: reviewerName ?? 'Anonymous nomad',
    reviewerImage,
  };
}

export async function getUserDashboardForProfile(user: SessionUser, months = 3) {
  'use cache: private';
  cacheLife({ stale: 60, expire: 300 });
  cacheTag(`user-dashboard-${user.id}`);

  try {
    return await getUserDashboardData(user, { months });
  } catch (error) {
    structuredLogger.error('Failed to load user dashboard', error, {
      component: 'profile.dal',
      userId: user.id,
    });
    throw error;
  }
}

export async function getOwnerReviewsForProfile(
  userId: string,
  role: UserRole
): Promise<OwnerListingReviews[]> {
  'use cache: private';
  cacheLife({ stale: 60, expire: 300 });
  cacheTag(`user-owner-reviews-${userId}`);

  if (role !== 'venueOwner') {
    return [];
  }

  try {
    const listingsCollection = (await getCollection('listings')) as Collection<ListingDoc>;
    const deletedStatuses = ['deleted', 'archived', 'removed'];

    const aggregatedListings = await listingsCollection
      .aggregate<{
        slug?: unknown;
        name?: unknown;
        reviews?: ReviewDoc[];
      }>([
        { $match: { ownerId: userId } },
        {
          $match: {
            $expr: {
              $not: {
                $in: [{ $toLower: { $ifNull: ['$status', ''] } }, deletedStatuses],
              },
            },
          },
        },
        {
          $set: {
            normalisedSlug: {
              $switch: {
                branches: [
                  {
                    case: { $eq: [{ $type: '$slug' }, 'string'] },
                    then: { $trim: { input: '$slug' } },
                  },
                  {
                    case: { $eq: [{ $type: '$slug.current' }, 'string'] },
                    then: { $trim: { input: '$slug.current' } },
                  },
                ],
                default: null,
              },
            },
          },
        },
        { $match: { normalisedSlug: { $ne: null } } },
        {
          $lookup: {
            from: 'reviews',
            let: { listingSlug: '$normalisedSlug' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$listingSlug', '$$listingSlug'] },
                  status: 'approved',
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 50 },
            ],
            as: 'reviews',
          },
        },
        { $project: { slug: 1, name: 1, reviews: 1 } },
      ])
      .toArray();

    return aggregatedListings
      .map(listingDoc => {
        const listing = normaliseListing({ slug: listingDoc.slug, name: listingDoc.name });
        if (!listing) {
          return null;
        }

        const reviews = (listingDoc.reviews ?? [])
          .map(normaliseReview)
          .filter((review): review is OwnerListingReview => review !== null);

        return { slug: listing.slug, name: listing.name, reviews };
      })
      .filter((listing): listing is OwnerListingReviews => listing !== null);
  } catch (error) {
    structuredLogger.error('Failed to load owner reviews', error, {
      component: 'profile.dal',
      userId,
    });
    throw error;
  }
}
