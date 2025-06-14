import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';

export async function GET() {
  try {
    // Corrected GROQ query to match your schema
    const query = groq`*[_type == "listing" && moderation.featured == true && moderation.status == "published"] | order(_createdAt desc)[0...10] {
      _id,
      name,
      "slug": slug.current,
      "primaryImage": primaryImage{
        ...,
        asset->
      },
      "galleryImages": galleryImages[]{
        ...,
        asset->
      },
      "location": city->{
        _id,
        name,
        country
      },
      price,
      moderation
    }`;

    const listings = await client.fetch(query);

    // console.log('API Route - Fetched featured listings:', JSON.stringify(listings, null, 2)); // Removed debugging log

    return NextResponse.json({
      listings,
      success: true,
      metadata: {
        total: listings.length,
        query_time: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch listings',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
