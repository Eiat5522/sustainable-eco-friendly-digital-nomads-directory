import { ApiResponseHandler } from '@/utils/api-response';
import { getCollection } from '@/utils/db-helpers';
import type { NextRequest } from 'next/server';

type ReviewDoc = {
  verified?: boolean;
  helpfulCount?: number;
  reviewerEmail?: string;
  [key: string]: unknown;
};

type ReviewsCollection = {
  find: (filter: Record<string, unknown>) => {
    sort: (s: Record<string, 1 | -1>) => {
      skip: (n: number) => {
        limit: (n: number) => { toArray: () => Promise<ReviewDoc[]> };
      };
    };
  };
  countDocuments: (filter: Record<string, unknown>) => Promise<number>;
};

type RouteContext = {
  params: Promise<Record<string, never>>;
  collection?: ReviewsCollection;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { searchParams } = new URL(request.url);
    const listingSlug = searchParams.get('listing');
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get('limit') || '10') || 10));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const filterRating = searchParams.get('rating');
    const verified = searchParams.get('verified') === 'true';

    const reviews: ReviewsCollection =
      context.collection ?? (await getCollection('reviews') as unknown as ReviewsCollection);

    // Build filter
    const filter: Record<string, unknown> = { status: 'approved' };
    if (listingSlug) filter.listingSlug = listingSlug;
    if (filterRating) filter.rating = Number.parseInt(filterRating);
    if (verified) filter.verified = true;

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
      reviews.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      reviews.countDocuments(filter)
    ]);

    const response = {
      reviews: (results as ReviewDoc[]).map((review) => ({
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
      }
    };

    return ApiResponseHandler.success(response);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return ApiResponseHandler.error('Failed to fetch reviews', 500);
  }
}

export async function POST() {
  // ...existing code...
}

// ...existing code...
