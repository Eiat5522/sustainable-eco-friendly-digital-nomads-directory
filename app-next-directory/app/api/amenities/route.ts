import { NextResponse } from 'next/server';
import { cacheHelpers } from '@/lib/cache-strategy';
import { getClient } from '@/lib/sanity';

export async function GET() {
  try {
    const sanityClient = getClient();
    const amenities = await cacheHelpers.amenities(async () => {
      return await sanityClient.fetch(`*[_type == "amenity"] | order(name asc) {
        _id,
        name
      }`);
    });
    return NextResponse.json({ amenities });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch amenities',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
