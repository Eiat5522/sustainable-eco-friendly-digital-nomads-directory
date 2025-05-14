import { NextResponse } from 'next/server';
import { getAllListings, getListingsByCategory, getListingsByCity } from '@/lib/sanity/queries';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    
    let listings;
    
    if (category) {
      listings = await getListingsByCategory(category);
    } else if (city) {
      listings = await getListingsByCity(city);
    } else {
      listings = await getAllListings();
    }
    
    return NextResponse.json({ 
      listings,
      count: listings.length,
      success: true
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings', success: false },
      { status: 500 }
    );
  }
}
