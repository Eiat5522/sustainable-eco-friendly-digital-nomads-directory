import { NextRequest, NextResponse } from 'next/server';
import { getListingBySlug } from '@/lib/sanity/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required', success: false },
        { status: 400 }
      );
    }
    
    const listing = await getListingBySlug(slug);
    
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found', success: false },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      listing,
      success: true
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing', success: false },
      { status: 500 }
    );
  }
}
