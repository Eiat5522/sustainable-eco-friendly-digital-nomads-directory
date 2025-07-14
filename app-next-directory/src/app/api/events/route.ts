import { NextResponse } from 'next/dist/server/web/spec-extension/response';
import { client } from '@/lib/sanity/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date().toISOString();

    const query = `*[_type == "event" && dateTime(startDate) >= dateTime($now)] | order(startDate asc) {
      _id,
      title,
      "slug": slug.current,
      startDate,
      endDate,
      location,
      ecoInitiatives,
      "imageUrl": mainImage.asset->url,
      description
    }`;

    const events = await getClient().fetch(query, { now });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error('Events API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
