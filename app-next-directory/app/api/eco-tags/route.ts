import { NextResponse } from 'next/server';
import { cacheHelpers } from '@/lib/cache-strategy';
import { client } from '@/lib/sanity';
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
