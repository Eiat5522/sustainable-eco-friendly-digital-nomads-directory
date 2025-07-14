import { NextRequest } from 'next/dist/server/web/spec-extension/request';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import { client } from '@/lib/sanity/client';

// Define the shape of the context parameter for Next.js 15+
type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { slug } = await context.params;
    console.log('[DEBUG] Cities/[slug] API: Looking for city with slug:', slug);

    const query = `*[_type == "city" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      description,
      country,
      sustainabilityScore,
      highlights,
      mainImage {
        asset->{
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        }
      },
      coordinates,
      climate,
      safety,
      walkability,
      airQuality,
      internetSpeed,
      costOfLiving
    }`;

    const client = getClient();
    console.log('[DEBUG] Cities/[slug] API: Executing query with slug:', slug);
    const city = await client.fetch(query, { slug });
    console.log('[DEBUG] Cities/[slug] API: Query result:', city ? 'Found city' : 'No city found');

    if (!city) {
      console.log('[DEBUG] Cities/[slug] API: City not found, returning 404');
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      );
    }

    console.log('[DEBUG] Cities/[slug] API: Successfully returning city:', city.title);
    return NextResponse.json({
      success: true,
      data: city
    });

  } catch (error) {
    console.error('[ERROR] Cities/[slug] API: Error fetching city details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch city details' },
      { status: 500 }
    );
  }
}
