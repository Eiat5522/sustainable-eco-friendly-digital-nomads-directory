import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity';

export async function GET() {
  try {
    const amenities = await client.fetch(`*[_type == "amenity"] | order(name asc) {
      _id,
      name
    }`);
    return NextResponse.json({ amenities });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch amenities' }, { status: 500 });
  }
}