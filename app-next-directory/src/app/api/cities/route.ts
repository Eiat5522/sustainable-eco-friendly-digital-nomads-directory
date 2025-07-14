import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';

export async function GET() {
  const startTime = performance.now();
  console.log('[DEBUG] Cities API: Request started at', new Date().toISOString());

  if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || !process.env.NEXT_PUBLIC_SANITY_DATASET) {
    console.error('[ERROR] Cities API: Sanity environment variables are not configured.');
    return NextResponse.json({
      error: 'Server configuration error: Sanity credentials missing.',
      success: false,
      cities: []
    }, { status: 500 });
  }
  
  try {
    const query = groq`*[_type == "city"] | order(_createdAt desc)[0...20] {
      _id,
      title,
      "slug": slug.current,
      country,
      sustainabilityScore,
      "mainImage": mainImage {
        alt,
        "asset": asset->{
          _id,
          url,
          metadata {
            dimensions,
            lqip
          }
        }
      }
    }`;

    console.log('[DEBUG] Cities API: Executing GROQ query');
    const queryStartTime = performance.now();
    
    const cities = await client.fetch(query);
    
    const queryEndTime = performance.now();
    console.log('[DEBUG] Cities API: GROQ query completed in', (queryEndTime - queryStartTime).toFixed(2), 'ms');
    console.log('[DEBUG] Cities API: Found', cities.length, 'cities');
      // Log data structure for first city if available
    if (cities.length > 0) {
      console.log('[DEBUG] Cities API: Sample city structure:', {
        hasId: !!cities[0]._id,
        hasTitle: !!cities[0].title,
        hasSlug: !!cities[0].slug,
        hasCountry: !!cities[0].country,
        hasMainImage: !!cities[0].mainImage,
        hasSustainabilityScore: !!cities[0].sustainabilityScore
      });
      
      // Log all city slugs for debugging
      console.log('[DEBUG] Cities API: Available city slugs:');
      cities.forEach((city: { title: string; slug: string }, index: number) => {
        console.log(`${index + 1}. ${city.title} -> slug: "${city.slug}"`);
      });
    }

    const endTime = performance.now();
    console.log('[DEBUG] Cities API: Total request time', (endTime - startTime).toFixed(2), 'ms');

    return NextResponse.json({
      cities,
      success: true,
      metadata: {
        total: cities.length,
        query_time: new Date().toISOString(),
        performance: {
          total_time_ms: (endTime - startTime).toFixed(2),
          query_time_ms: (queryEndTime - queryStartTime).toFixed(2)
        }
      }
    });
  } catch (error) {
    const endTime = performance.now();
    console.error('[ERROR] Cities API: Request failed after', (endTime - startTime).toFixed(2), 'ms');
    console.error('[ERROR] Cities API:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch cities',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      performance: {
        total_time_ms: (endTime - startTime).toFixed(2)
      }
    }, { status: 500 });
  }
}
