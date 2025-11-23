import type { NextRequest } from 'next/server';
import logger from '@/lib/logger';
import { getFeaturedListings } from '@/lib/sanity/queries';
import { ApiResponseHandler } from '@/utils/api-response';

/**
 * GET /api/listings/featured
 * Returns featured listings from Sanity
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit') || '4';

  try {
    // Get limit from query params (default to 4)
    const limit = Number.parseInt(limitParam, 10);

    // Fetch featured listings from Sanity
    const listings = await getFeaturedListings();

    // Return only the requested number of listings
    const limitedListings = listings.slice(0, limit);

    return ApiResponseHandler.success(limitedListings);
  } catch (error) {
    logger.error('Failed to fetch featured listings', error, {
      component: 'api/listings/featured',
      limit: limitParam,
    });
    return ApiResponseHandler.error('Failed to fetch featured listings');
  }
}
