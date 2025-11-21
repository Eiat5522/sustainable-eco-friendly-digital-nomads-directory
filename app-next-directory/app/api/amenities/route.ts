import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { cacheHelpers } from '@/lib/cache-strategy';

// Cache for 24 hours - amenities rarely change
export const revalidate = 86400; // 24 hours

export async function GET() {
  try {
    const amenities = await cacheHelpers.amenities(async () => {
      return await client.fetch(`*[_type == "amenity"] | order(name asc) {
        _id,
        name
      }`);
    });
    return NextResponse.json({ amenities });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch amenities' }, { status: 500 });
  }
}