import { searchListings } from '@/lib/search';
import { SearchFilters, SortOption } from '@/types/search';
import { ApiResponseHandler } from '@/utils/api-response';
import { getCollection } from '@/utils/db-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { query, filters, page = 1, limit = 12, sort }: {
      query?: string;
      filters?: SearchFilters;
      page?: number;
      limit?: number;
      sort?: SortOption;
    } = await request.json();

    const searchResults = await searchListings(query || '', filters, page, limit, sort);

    return NextResponse.json(searchResults);  } catch (error) {
    console.error('Search error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to perform search', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const minRating = searchParams.get('minRating');
    const ecoFeatures = searchParams.get('ecoFeatures')?.split(',') || [];
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const listings = await getCollection('listings');

    const filter: any = { status: 'active' };

    // Text search
    if (query) {
      filter.$text = { $search: query };
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Location filter
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    // Eco features filter
    if (ecoFeatures.length > 0) {
      filter.eco_features = { $in: ecoFeatures };
    }

    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: filter },
      // Add average rating from reviews
      {
        $lookup: {
          from: 'reviews',
          localField: 'slug',
          foreignField: 'listingSlug',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          averageRating: {
            $avg: {
              $filter: {
                input: '$reviews.rating',
                cond: { $eq: ['$$this.status', 'approved'] }
              }
            }
          }
        }
      },
      // Filter by minimum rating if specified
      ...(minRating ? [{ $match: { averageRating: { $gte: parseFloat(minRating) } } }] : []),
      { $skip: skip },
      { $limit: limit }
    ];

    const [results, total] = await Promise.all([
      listings.aggregate(pipeline).toArray(),
      listings.countDocuments(filter)
    ]);

    return ApiResponseHandler.success({
      listings: results,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        query,
        category,
        location,
        minRating,
        ecoFeatures
      }
    });
  } catch (error) {
    return ApiResponseHandler.error('Search failed');
  }
}
