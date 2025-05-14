import { NextResponse } from 'next/server';
import { getFilteredListings } from '@/lib/sanity/queries';

/**
 * API Route for listings with filtering
 * 
 * Example: /api/listings?category=coworking&city=bangkok
 */
export async function GET(request) {
  try {
    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const ecoTags = searchParams.getAll('ecoTag');
    const nomadFeatures = searchParams.getAll('nomadFeature');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Query Sanity for listings with filters
    const listings = await getFilteredListings({
      category,
      city,
      ecoTags,
      nomadFeatures,
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
