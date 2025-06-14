import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';

export async function GET() {
  try {
    const query = groq`*[_type == "city"] | order(_createdAt desc)[0...20] {
      _id,
      title,
      "slug": slug.current,
      country,
      description,
      sustainabilityScore,
      highlights,
      mainImage {
        ...,
        asset->
      }
    }`;

    const cities = await client.fetch(query);

    return NextResponse.json({
      cities,
      success: true,
      metadata: {
        total: cities.length,
        query_time: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch cities',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
