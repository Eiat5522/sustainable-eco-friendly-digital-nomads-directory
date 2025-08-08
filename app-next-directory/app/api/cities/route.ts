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
    const CITIES_QUERY = groq`*[_type == "city"] | order(_createdAt desc)[0...20] {
      _id,
      name,
      "slug": slug.current,
      country,
      sustainabilityScore,
      highlights,
      "image": primaryImage { // TODO: rename field in schema to primaryImage later
        alt,
        _type,
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
    const cities = await client.fetch<RawCity[]>(CITIES_QUERY);
    const queryEndTime = performance.now();

    const dtoListCities = cities.map(city => ({
      _id: city._id,
      name: city.name,
      slug: city.slug,
      country: city.country,
      sustainabilityScore: city.sustainabilityScore,
      highlights: city.highlights || [],
      image: city.image || { _type: 'image', asset: { _id: '', url: '', metadata: { dimensions: { width: 0, height: 0 }, lqip: '' } } },
    }));

    const endTime = performance.now();
    console.log('[DEBUG] Cities API: Total request time', (endTime - startTime).toFixed(2), 'ms');

    return NextResponse.json({
      cities: dtoListCities,
      success: true,
      metadata: {
        total: dtoListCities.length,
        query_time: new Date().toISOString(),
        performance: {
          totalTimeMs: (endTime - startTime).toFixed(2),
          queryTimeMs: (queryEndTime - queryStartTime).toFixed(2)
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
        totalTimeMs: (endTime - startTime).toFixed(2)
      }
    }, { status: 500 });
  }
}

interface RawCity {
  _id: string;
  name: string;
  slug: string;
  country: string;
  sustainabilityScore: number;
  highlights?: string[];
  image?: {
    alt?: string;
    _type: 'image';
    asset?: {
      _id?: string;
      url?: string;
      metadata?: {
        dimensions?: { width: number; height: number };
        lqip?: string;
        };
      }
    }   
}