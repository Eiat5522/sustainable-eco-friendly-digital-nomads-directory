import { client } from '@/lib/sanity/client';

type FetchFn = (query: string, params?: Record<string, unknown>) => Promise<unknown>;

export async function GET(_request: Request, fetchFn: FetchFn = client.fetch.bind(client)) {
  try {
    const now = new Date().toISOString();

    const query = `*[_type == "event" && dateTime(startDate) >= dateTime($now)] | order(startDate asc) {
      _id,
      title,
      "slug": slug.current,
      startDate,
      endDate,
      location,
      ecoInitiatives,
      "imageUrl": primaryImage.asset->url,
      description
    }`;

    const fetchFn =
      testControl.clientFetchOverride ??
      ((queryString: string, params?: Record<string, unknown>) => client.fetch(queryString, params));
    const events = await fetchFn(query, { now });

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
