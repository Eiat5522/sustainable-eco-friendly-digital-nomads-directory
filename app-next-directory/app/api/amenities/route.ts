import { NextResponse } from 'next/server';
import { cacheHelpers } from '@/lib/cache-strategy';
import { client } from '@/lib/sanity';

// MIGRATED: Removed `export const revalidate = 86400` (incompatible with
// cacheComponents). To migrate, consider adding `"use cache"` to the cached
// data helper and using `cacheLife('days')` or a similar profile. TODO: decide
// cacheLife profile and add `cacheLife()` in the helper.

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
