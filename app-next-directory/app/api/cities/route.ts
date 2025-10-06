import { NextResponse } from 'next/server';
import { client } from '@/lib/sanity';

export async function GET() {
  try {
    const cities = await client.fetch(`*[_type == "city"] | order(name asc) {
      _id,
      name
    }`);
    return NextResponse.json({ cities });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cities' }, { status: 500 });
  }
}