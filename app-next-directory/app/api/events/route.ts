import { structuredLogger } from '@/lib/logger';
import { getSanityClient } from '@/lib/sanity/client'; // Changed import

type FetchFn = (query: string, params?: Record<string, unknown>) => Promise<unknown>;

const isTestEnv = process.env.NODE_ENV === 'test';

type EventsTestControl = {
  clientFetchOverride?: FetchFn;
};

const _testControl: EventsTestControl | undefined = isTestEnv
  ? {
      clientFetchOverride: undefined,
    }
  : undefined;

if (process.env.NODE_ENV === 'test') {
  (module.exports as Record<string, unknown>)._testControl = _testControl;
}

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
      ((queryString: string, params?: Record<string, unknown>) =>
        getSanityClient().fetch(queryString, params)); // Updated to use getSanityClient().fetch
    const events = await fetchFn(query, { now });

    return new Response(JSON.stringify({ success: true, data: events }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    structuredLogger.error('Events API Error', error, { component: 'events-api' });
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch events' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
