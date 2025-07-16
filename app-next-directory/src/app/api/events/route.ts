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

    const events = await client.fetch(query, { now });

    return new Response(JSON.stringify({ success: true, data: events }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Events API Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch events' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
