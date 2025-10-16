import { Collection } from 'mongodb';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { auth } from '@/lib/auth';
import { getCollection } from '@/utils/db-helpers';

type SessionUser = {
  id?: string | null;
  role?: string | null;
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

type NormalisedListing = {
  slug: string;
  name: string;
};

type NormalisedReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerName: string;
  reviewerImage?: string;
};

export function normaliseSlug(rawSlug: unknown): string | null {
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

export function normaliseListing(doc: ListingDoc): NormalisedListing | null {
  const slug = normaliseSlug(doc.slug);
  if (!slug) {
    return null;
  }

  const name = typeof doc.name === 'string' && doc.name.trim().length > 0 ? doc.name.trim() : 'Untitled listing';

  return { slug, name };
}

export function normaliseReview(doc: ReviewDoc): NormalisedReview | null {
  const ratingNumber = Number(doc.rating);
  if (!Number.isFinite(ratingNumber) || ratingNumber <= 0) {
    return null;
  }

  const comment = typeof doc.comment === 'string' ? doc.comment : '';
  const createdAt = doc.createdAt instanceof Date
    ? doc.createdAt.toISOString()
    : typeof doc.createdAt === 'string' && doc.createdAt.trim().length > 0
      ? new Date(doc.createdAt).toISOString()
      : new Date().toISOString();

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

  const id = typeof doc._id === 'string'
    ? doc._id
    : doc._id && typeof doc._id === 'object' && 'toString' in doc._id
      ? String((doc._id as { toString: () => string }).toString())
      : randomUUID();

  return {
    id,
    rating: ratingNumber,
    comment,
    createdAt,
    reviewerName: reviewerName ?? 'Anonymous nomad',
    reviewerImage,
  };
}

export function isDeletedStatus(status: unknown): boolean {
  if (typeof status !== 'string') return false;
  const normalised = status.toLowerCase();
  return normalised === 'deleted' || normalised === 'archived' || normalised === 'removed';
}

export const testControl = {
  authOverride: undefined as (() => Promise<unknown>) | undefined,
  getCollectionOverride: undefined as ((collection: string) => Promise<unknown>) | undefined,
};

export async function GET() {
  const session = await (testControl.authOverride ? testControl.authOverride() : auth());
  const user = session?.user as SessionUser | undefined;
  const userId = user?.id ?? null;
  const role = user?.role ?? null;

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (role !== 'venueOwner') {
    return NextResponse.json({ listings: [] }, { status: 200 });
  }

  try {
    const collectionGetter = testControl.getCollectionOverride ?? getCollection;
    const listingsCollection = (await collectionGetter('listings')) as Collection<ListingDoc>;
    const rawListings = await listingsCollection
      .find({ ownerId: userId })
      .project({ slug: 1, name: 1, status: 1 })
      .toArray();

    const listings: NormalisedListing[] = [];
    for (const doc of rawListings) {
      if (isDeletedStatus(doc.status)) {
        continue;
      }
      const listing = normaliseListing(doc);
      if (listing) {
        listings.push(listing);
      }
    }

    if (listings.length === 0) {
      return NextResponse.json({ listings: [] });
    }

    const reviewsCollection = (await collectionGetter('reviews')) as Collection<ReviewDoc>;
    const results: Array<{ slug: string; name: string; reviews: NormalisedReview[] }> = [];

    for (const listing of listings) {
      const cursor = reviewsCollection
        .find({ listingSlug: listing.slug, status: 'approved' })
        .sort({ createdAt: -1 })
        .limit(50);

      const rawReviews = await cursor.toArray();
      const reviews: NormalisedReview[] = [];
      for (const review of rawReviews) {
        const normalised = normaliseReview(review);
        if (normalised) {
          reviews.push(normalised);
        }
      }

      results.push({ slug: listing.slug, name: listing.name, reviews });
    }

    return NextResponse.json({ listings: results });
  } catch (error) {
    console.error('[api/user/reviews] failed to load owner reviews', error);
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}
