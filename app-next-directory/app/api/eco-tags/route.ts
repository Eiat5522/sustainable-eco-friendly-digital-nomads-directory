import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity';

export async function GET() {
  try {
    const ecoTags = await client.fetch(`*[_type == "ecoTag"] | order(name asc) {
      _id,
      name
    }`);
    return NextResponse.json({ ecoTags });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch eco tags' }, { status: 500 });
  }
}