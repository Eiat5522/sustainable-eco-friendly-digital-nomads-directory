import { cachedClient } from '@/lib/sanity/cached-client';
import { urlFor } from '@/lib/sanity/client';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { revalidateTag } from 'next/cache';
import { hasFeaturePermission, UserRole } from '@/types/auth';
import { structuredLogger, getRequestContext } from '@/lib/logger';
import { ensureSanityUser } from '@/lib/sanity/user';
import { groq } from 'next-sanity';

const REVIEWS_BY_LISTING_QUERY = groq`
  *[_type == "review" && listing._ref == $listingId && (
    (!defined(approved) || approved == true) ||
    (defined($userId) && $userId != "" && user._ref == $userId)
  )] | order(coalesce(createdAt, _createdAt) desc) {
    _id,
    rating,
    comment,
    approved,
    createdAt,
    _createdAt,
    user->{
      _id,
      name,
      image,
      avatar
    }
  }
`;

type RawReview = {
  _id?: unknown;
  rating?: unknown;
  comment?: unknown;
  approved?: unknown;
  createdAt?: unknown;
  _createdAt?: unknown;
  user?: {
    _id?: unknown;
    name?: unknown;
    image?: unknown;
    avatar?: unknown;
  } | null;
};

type NormalizedReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: 'approved' | 'pending';
  user: {
    id?: string;
    name: string;
    image?: string;
  };
};

const buildUserImage = (user: RawReview['user']): string | undefined => {
  if (!user) return undefined;

  const directUrl = typeof user.image === 'string' ? user.image.trim() : '';
  if (directUrl) {
    return directUrl;
  }

  if (user.avatar) {
    try {
      const builder = urlFor(user.avatar as Parameters<typeof urlFor>[0]);
      return builder.width(96).height(96).fit('crop').auto('format').url();
    } catch (error) {
      console.warn('[api/reviews] failed to build avatar url', error);
      return undefined;
    }
  }

  return undefined;
};

const normalizeReview = (review: RawReview): NormalizedReview | null => {
  const id = typeof review._id === 'string' ? review._id : null;
  const rating = Number(review.rating);
  if (!id || !Number.isFinite(rating) || rating <= 0 || rating > 5) {
    return null;
  }

  const comment = typeof review.comment === 'string' ? review.comment.trim() : '';
  const createdAt =
    (typeof review.createdAt === 'string' && review.createdAt) ||
    (typeof review._createdAt === 'string' && review._createdAt) ||
    new Date().toISOString();

  const userName =
    (review.user && typeof review.user.name === 'string' && review.user.name.trim().length > 0)
      ? review.user.name.trim()
      : 'Anonymous';

  const status: 'approved' | 'pending' = review.approved === false ? 'pending' : 'approved';

  return {
    id,
    rating,
    comment,
    createdAt,
    status,
    user: {
      id: typeof review.user?._id === 'string' ? review.user?._id : undefined,
      name: userName,
      image: buildUserImage(review.user),
    },
  };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listingId')?.trim();
  const userIdParam = searchParams.get('userId')?.trim();

  if (!listingId) {
    return NextResponse.json({ error: 'listingId query parameter is required' }, { status: 400 });
  }

  try {
    const rawReviews = await cachedClient.fetch<RawReview[]>(REVIEWS_BY_LISTING_QUERY, {
      listingId,
      userId: userIdParam && userIdParam.length > 0 ? userIdParam : undefined,
    }, { next: { tags: [`listing:${listingId}-reviews`] } });

    const normalized: NormalizedReview[] = [];
    let sum = 0;

    for (const raw of rawReviews ?? []) {
      const review = normalizeReview(raw);
      if (!review) continue;

      // Exclude pending reviews from aggregate metrics but keep them in payload for transparency
      if (review.status === 'approved') {
        sum += review.rating;
      }

      normalized.push(review);
    }

    const approvedCount = normalized.filter((r) => r.status === 'approved').length;
    const pendingCount = normalized.length - approvedCount;
    const statistics = {
      totalReviews: approvedCount,
      approvedReviews: approvedCount,
      pendingReviews: pendingCount > 0 ? pendingCount : 0,
      averageRating: approvedCount > 0 ? Number((sum / approvedCount).toFixed(2)) : null,
    } as const;

    return NextResponse.json({ reviews: normalized, statistics });
  } catch (caughtError) {
    structuredLogger.apiError('/api/reviews', caughtError, {
      ...getRequestContext(request),
      listingId,
      userId: userIdParam,
      operation: 'fetch_reviews',
    });
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();

  const user = session?.user as { id?: string; role?: UserRole; email?: string | null; name?: string | null } | undefined;
  const userId: string | undefined = user?.id;
  const userRole: UserRole = user?.role || 'unidentifiedUser';
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has permission to submit reviews
  if (!hasFeaturePermission(userRole, 'submitReviews')) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions to create reviews' }, { status: 403 });
  }

  try {
    const { rating, comment, listingId } = await request.json();

    if (!rating || !comment || !listingId) {
      return NextResponse.json({ error: 'Invalid or missing fields' }, { status: 422 });
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 422 });
    }

    if (typeof comment !== 'string' || !comment.trim()) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 422 });
    }

    if (typeof listingId !== 'string') {
      return NextResponse.json({ error: 'Invalid listing ID' }, { status: 422 });
    }

    // Validate referenced documents to avoid dangling references
    const [listingDoc, sanityUser] = await Promise.all([
      client.getDocument(listingId),
      ensureSanityUser({
        id: userId,
        name: user?.name ?? null,
        email: user?.email ?? null,
        role: userRole,
      }),
    ]);

    if (!listingDoc || !sanityUser) {
      return NextResponse.json({ error: 'Invalid reference(s)' }, { status: 400 });
    }

    // Check if user has already reviewed this listing
    const existingReview = await client.fetch<RawReview | null>(
      `*[_type == "review" && listing._ref == $listingId && user._ref == $userId][0]`,
      { listingId, userId }
    );

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this listing' }, { status: 409 });
    }

    const reviewDoc = {
      _type: 'review' as const,
      listing: { _type: 'reference', _ref: listingId },
      user: { _type: 'reference', _ref: sanityUser._id },
      rating,
      comment: comment.trim(),
      approved: false,
      createdAt: new Date().toISOString(),
    };

    type CreatedReview = typeof reviewDoc & { _id?: string };
    const newReview = await client.create<CreatedReview>(reviewDoc);

    try {
      revalidateTag(`listing:${listingId}-reviews`);
    } catch {
      // ignore if not in a revalidatable context
    }

    return NextResponse.json(newReview);
  } catch (caughtError) {
    structuredLogger.apiError('/api/reviews', caughtError, {
      ...getRequestContext(request),
      userId,
      userRole,
      operation: 'create_review'
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
