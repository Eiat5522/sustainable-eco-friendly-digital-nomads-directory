import { NextResponse } from 'next/server';
import { cacheHelpers } from '@/lib/cache-strategy';
import { client } from '@/lib/sanity';

// MIGRATED: Removed `export const revalidate = 86400` (incompatible with
// cacheComponents). To migrate, consider adding `"use cache"` to the cached
// data helper and using `cacheLife('days')` or a similar profile. TODO: decide
// cacheLife profile and add `cacheLife()` in the helper.

export async function GET() {
  try {
    const ecoTags = await cacheHelpers.ecoTags(async () => {
      return await client.fetch(`*[_type == "ecoTag"] | order(name asc) {
        _id,
        name
      }`);
    });
    return NextResponse.json({ ecoTags });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch eco tags' }, { status: 500 });
  }
}
