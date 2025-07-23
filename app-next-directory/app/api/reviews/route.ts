import { ApiResponseHandler } from '@/utils/api-response';
import { getCollection } from '@/utils/db-helpers';
import { rateLimit } from '@/utils/rate-limit';
import { z } from 'zod';

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
    const filter: any = { status: 'approved' };
    if (listingSlug) filter.listingSlug = listingSlug;
    if (filterRating) filter.rating = parseInt(filterRating);
    if (verified) filter.verified = true;

    // Build sort
    const sort: any = {};
    switch (sortBy) {
      case 'rating':
        sort.rating = -1;
        break;
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
      reviews: results.map((review: any) => ({
        ...review,
        reviewerEmail: undefined,
        isVerified: review.verified || false,
        isHelpful: review.helpfulCount > 0,
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

export async function POST(request: Request) {
  // ...existing code...
}

// ...existing code...
