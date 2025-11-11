import { client } from '@/lib/sanity/client';
import logger from '@/lib/logger';

type FetchFn = (query: string, params?: Record<string, unknown>) => Promise<unknown>;

const isTestEnv = process.env.NODE_ENV === 'test';

export const _testControl = isTestEnv
  ? {
      clientFetchOverride: undefined as FetchFn | undefined,
    }
  : undefined;

export async function GET(_request: Request) {
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
      _testControl?.clientFetchOverride ??
      ((queryString: string, params?: Record<string, unknown>) => client.fetch(queryString, params));
    const events = await fetchFn(query, { now });

    return new Response(JSON.stringify({ success: true, data: events }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Events API Error', error, { component: 'events-api' });
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch events' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
