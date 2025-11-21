import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { cacheHelpers } from '@/lib/cache-strategy';

// Cache for 24 hours - eco tags rarely change
export const revalidate = 86400; // 24 hours

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