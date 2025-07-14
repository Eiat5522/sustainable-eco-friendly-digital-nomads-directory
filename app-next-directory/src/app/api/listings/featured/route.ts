import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { getFeaturedListings } from '@/lib/sanity/queries';
import { ApiResponseHandler } from '@/utils/api-response';

/**
 * GET /api/listings/featured
 * Returns featured listings from Sanity
 */
export async function GET(request: NextRequest) {
  try {
    // Get limit from query params (default to 4)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '4');

    // Fetch featured listings from Sanity
    const listings = await getFeaturedListings();

    // Return only the requested number of listings
    const limitedListings = listings.slice(0, limit);

    return ApiResponseHandler.success(limitedListings);
  } catch (error) {
    console.error('Failed to fetch featured listings:', error);
    return ApiResponseHandler.error('Failed to fetch featured listings');
  }
}
