import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import { isE2ERun } from '@/data/e2e/discovery-fixtures';

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
    if (isE2ERun()) {
      return new Response(JSON.stringify({ success: true, data: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
        client.fetch(queryString, params));
    const events = await fetchFn(query, { now });

    return new Response(
      JSON.stringify({ success: true, data: Array.isArray(events) ? events : [] }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    structuredLogger.error('Events API Error', error, { component: 'events-api' });
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch events' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
