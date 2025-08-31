import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity/client';
import { groq } from 'next-sanity';

export async function GET() {
  try {
    const categories: string[] = await client.fetch(
      groq`array::unique(*[_type == "listing" && defined(category)].category)`
    );
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

