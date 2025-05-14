import { NextResponse } from 'next/server';
import { getFilteredListings } from '@/lib/sanity/queries';

/**
 * API Route for listings with filtering
 * 
 * Example: /api/listings?category=coworking&city=bangkok&search=quiet&minRating=4
 */
export async function GET(request) {
  try {
    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    
    const searchQuery = searchParams.get('search');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const ecoTags = searchParams.getAll('ecoTag');
    const nomadFeatures = searchParams.getAll('nomadFeature');
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')) : null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Query Sanity for listings with filters
    const listings = await getFilteredListings({
      searchQuery,
      category,
      city,
      ecoTags,
      nomadFeatures,
      minRating,
      limit,
      offset
    });

    // Return listings as JSON response
    return NextResponse.json({
      status: 'success',
      count: listings.length,
      data: listings
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch listings',
        error: error.message
      },
      { status: 500 }
    );
  }
}
