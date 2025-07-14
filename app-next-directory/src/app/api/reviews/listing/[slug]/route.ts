import { ApiResponseHandler } from '@/utils/api-response';
import { getCollection } from '@/utils/db-helpers';
import { NextRequest } from 'next/dist/server/web/spec-extension/request';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const reviews = await getCollection('reviews');

    const filter = {
      listingSlug: params.slug,
      status: 'approved'
    };

    const skip = (page - 1) * limit;

    const [results, total, avgRating] = await Promise.all([
      reviews.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      reviews.countDocuments(filter),
      reviews.aggregate([
        { $match: filter },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]).toArray()
    ]);

    return ApiResponseHandler.success({
      reviews: results,
      averageRating: avgRating[0]?.avgRating || 0,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return ApiResponseHandler.error('Failed to fetch listing reviews');
  }
}
