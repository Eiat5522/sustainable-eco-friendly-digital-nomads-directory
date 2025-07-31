import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';
import { NextResponse } from 'next/dist/server/web/spec-extension/response';

export async function GET() {
  try {
    const query = groq`*[_type == "amenity"]{ _id, name, description, badge{ asset->{ url } } }`;
    const amenities = await client.fetch(query);
    return NextResponse.json({ amenities });
  } catch (error) {
    console.error('Failed to fetch amenities:', error);
    return NextResponse.json({ error: 'Failed to fetch amenities' }, { status: 500 });
  }
}