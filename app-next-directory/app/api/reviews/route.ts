import type { Collection } from 'mongodb';
import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { getRequestContext, structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import { ensureSanityUser } from '@/lib/sanity/user';
import { hasFeaturePermission, type UserRole } from '@/types/auth';
import { ApiResponseHandler } from '@/utils/api-response';
import { getCollection } from '@/utils/db-helpers';

type ReviewDoc = {
  verified?: boolean;
  helpfulCount?: number;
  reviewerEmail?: string;
  [key: string]: unknown;
};

type RouteContext = {
  params: Promise<Record<string, never>>;
  collection?: Collection<ReviewDoc>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { searchParams } = new URL(request.url);
    const listingSlug = searchParams.get('listing');
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(searchParams.get('limit') || '10', 10) || 10)
    );
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const filterRating = searchParams.get('rating');
    const verified = searchParams.get('verified') === 'true';
    const userId = searchParams.get('userId'); // New: Optional userId parameter

    const reviews: Collection<ReviewDoc> =
      context.collection ?? ((await getCollection('reviews')) as Collection<ReviewDoc>);

    // Build filter
    const filter: Record<string, unknown> = {};
    if (listingSlug) filter.listingSlug = listingSlug; // Filter by slug in DB
    if (filterRating) filter.rating = Number.parseInt(filterRating, 10);
    if (verified) filter.verified = true;

    // If userId is provided, include pending reviews by that user
    if (userId) {
      filter.$or = [
        { status: 'approved' },
        { status: 'pending', user: userId }, // Assuming user field stores userId
      ];
    } else {
      filter.status = 'approved';
    }

    // Build sort
    const sort: Record<string, 1 | -1> = {};
    switch (sortBy) {
      case 'helpful':
        sort.helpfulCount = -1;
        break;
      default:
        sort.createdAt = -1;
    }

    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      reviews.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
      reviews.countDocuments(filter),
    ]);

    const response = {
      reviews: (results as ReviewDoc[]).map(review => ({
        ...review,
        reviewerEmail: undefined,
        isVerified: Boolean(review.verified),
        isHelpful: (review.helpfulCount ?? 0) > 0,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };

    return ApiResponseHandler.success(response);
  } catch (error) {
    structuredLogger.error('Failed to fetch reviews', error, {
      ...getRequestContext(request),
      component: 'api/reviews',
    });
    return ApiResponseHandler.error('Failed to fetch reviews', 500);
  }
}

const reviewInputSchema = z
  .object({
    listingId: z.string().min(1, 'Listing ID is required.'),
    rating: z.coerce
      .number({ invalid_type_error: 'Rating must be a number between 1 and 5.' })
      .min(1, 'Rating must be a number between 1 and 5.')
      .max(5, 'Rating must be a number between 1 and 5.'),
    comment: z.string().trim().min(20, 'Comment must be at least 20 characters.'),
    ecoRating: z.coerce
      .number({ invalid_type_error: 'Eco rating must be a number between 1 and 5.' })
      .min(1, 'Eco rating must be between 1 and 5.')
      .max(5, 'Eco rating must be between 1 and 5.')
      .optional(),
    nomadRating: z.coerce
      .number({ invalid_type_error: 'Nomad rating must be a number between 1 and 5.' })
      .min(1, 'Nomad rating must be between 1 and 5.')
      .max(5, 'Nomad rating must be between 1 and 5.')
      .optional(),
  })
  .passthrough();

export async function POST(request: NextRequest) {
  const session = await auth(request.headers);

  const user = session?.user as
    | { id?: string; role?: UserRole; email?: string | null; name?: string | null }
    | undefined;
  const userId: string | undefined = user?.id;
  const userRole: UserRole = user?.role || ('user' as UserRole);

  if (!userId) {
    return ApiResponseHandler.error('Unauthorized', 401);
  }

  if (!hasFeaturePermission(userRole, 'submitReviews')) {
    return ApiResponseHandler.error('Forbidden: Insufficient permissions to create reviews', 403);
  }

  let parsed: (z.infer<typeof reviewInputSchema> & { comment: string }) | undefined;

  try {
    const body = await request.json();
    const result = reviewInputSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.errors[0]?.message ?? 'Invalid review data';
      return ApiResponseHandler.error(firstError, 422, result.error.format());
    }
    parsed = result.data;
  } catch (_error) {
    return ApiResponseHandler.error('Invalid review data', 422);
  }

  const { listingId, rating, comment, ecoRating, nomadRating } = parsed;

  try {
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
      return ApiResponseHandler.error('Invalid reference(s)', 400);
    }

    const existingReview = await client.fetch(
      `*[_type == "review" && listing._ref == $listingId && user._ref == $userId][0]`,
      { listingId, userId }
    );

    if (existingReview) {
      return ApiResponseHandler.error('You have already reviewed this listing', 409);
    }

    const now = new Date().toISOString();
    const reviewDoc: {
      _type: string;
      listing: { _type: string; _ref: string };
      user: { _type: string; _ref: string };
      rating: number;
      comment: string;
      approved: boolean;
      createdAt: string;
      ecoRating?: number;
      nomadRating?: number;
    } = {
      _type: 'review',
      listing: { _type: 'reference', _ref: listingId },
      user: { _type: 'reference', _ref: sanityUser._id },
      rating,
      comment,
      approved: false,
      createdAt: now,
    };

    if (typeof ecoRating === 'number') {
      reviewDoc.ecoRating = ecoRating;
    }
    if (typeof nomadRating === 'number') {
      reviewDoc.nomadRating = nomadRating;
    }

    const newReview = (await (client.create as (doc: unknown) => Promise<{ _id: string }>)(
      reviewDoc
    ));

    const listingSlug = (listingDoc as { slug?: { current?: string } } | null | undefined)?.slug
      ?.current;
    if (listingSlug) {
      try {
        revalidateTag(`listing:${listingSlug}`, 'max');
      } catch {
        // Ignore revalidation errors in non-ISR contexts
      }
    }

    const reviewResult = newReview as { _id?: string; approved?: boolean; createdAt?: string };
    const responsePayload = {
      id: reviewResult._id ?? undefined,
      rating,
      comment,
      approved: Boolean(reviewResult.approved),
      createdAt: reviewResult.createdAt ?? now,
      ...(typeof ecoRating === 'number' ? { ecoRating } : {}),
      ...(typeof nomadRating === 'number' ? { nomadRating } : {}),
    };

    return NextResponse.json(
      { success: true, data: responsePayload, message: 'Review submitted successfully' },
      { status: 201 }
    );
  } catch (error) {
    structuredLogger.apiError('/api/reviews', error, {
      ...getRequestContext(request),
      userId,
      userRole,
      operation: 'create_review',
    });
    return ApiResponseHandler.error('Failed to submit review', 500);
  }
}
