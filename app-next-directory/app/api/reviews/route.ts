import { ApiResponseHandler } from '@/utils/api-response';
import { getCollection } from '@/utils/db-helpers';
// import { rateLimit } from '@/utils/rate-limit';

// ...existing code...

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const listingSlug = searchParams.get('listing');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'));
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const filterRating = searchParams.get('rating');
    const verified = searchParams.get('verified') === 'true';

  const reviews = await getCollection('reviews');

    // Build filter
  const filter: Record<string, unknown> = { status: 'approved' };
    if (listingSlug) filter.listingSlug = listingSlug;
    if (filterRating) filter.rating = parseInt(filterRating);
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

    type ReviewDoc = {
      verified?: boolean;
      helpfulCount?: number;
      reviewerEmail?: string;
      [key: string]: unknown;
    };

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
