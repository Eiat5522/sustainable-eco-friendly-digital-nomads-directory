import { getClient } from '@/lib/sanity/client';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is missing' }, { status: 400 });
    }

    const listing = await getClient().fetch(
      `*[_type == "listing" && slug.current == $slug][0]{
        ...,
        city->{name, country},
        images[]{
          asset->{
            url,
            metadata
          }
        }
      }`,
      { slug }
    );

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error fetching listing by slug:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
