import { http, HttpResponse } from 'msw'
import { mockListings as testListings } from '@/tests/helpers/test-data'
import { mockFeaturedVenues } from '@/components/sections/featuredVenuesMockData'

export const handlers = [
  // Search endpoints to silence unhandled warnings where tests don't mock fetch
  http.get('/api/search', () => {
    return HttpResponse.json(
      { data: { results: [], pagination: { total: 0, page: 1, totalPages: 0, hasMore: false } } },
      { status: 200 }
    )
  }),
  http.post('/api/search', async ({ request }) => {
    // Minimal functional stub that mirrors the request body shape
    let body: any = {};
    try {
      body = await request.json();
    } catch {}
    const q = body?.query ?? '';
    let results: any[] = [];
    if (q === 'an') {
      results = [{ id: 2, name: 'Banana' }];
    } else if (typeof q === 'string' && q.trim() === 'apple') {
      results = [{ id: 1, name: 'Apple' }];
    } else {
      results = [];
    }
    // Debug to verify MSW interception in tests
    // eslint-disable-next-line no-console
    console.log('MSW POST /api/search hit with query:', q);
    return HttpResponse.json(
      {
        results,
        pagination: { total: results.length, page: 1, totalPages: 1, hasMore: false }
      },
      { status: 200 }
    )
  }),
  http.get('/api/search/suggestions', () => {
    // Return array per hook expectations
    return HttpResponse.json([], { status: 200 })
  }),
  http.get('/api/featured-listings', () => {
    // Return the same mock data that the FeaturedListings test expects
    return HttpResponse.json({ listings: mockFeaturedVenues }, { status: 200 })

  }),
  http.get('/api/categories', () => {
    return HttpResponse.json({ categories: [] }, { status: 200 })
  }),
  http.get('/api/amenities', () => {
    return HttpResponse.json({ amenities: [] }, { status: 200 })
  }),
  http.get('/api/cities', () => {
    return HttpResponse.json({ cities: [] }, { status: 200 })
  }),
  http.get('/api/cities/:slug', ({ params }) => {
    const { slug } = params as any
    return HttpResponse.json({ success: true, data: { id: slug, name: slug, slug } }, { status: 200 })
  }),
  http.get('/api/hello', () => {
    return HttpResponse.json({ message: 'Hello' }, { status: 200 })
  }),
  // Test listings endpoint for unit/integration tests
  http.get('/api/test-listings', () => {
    return HttpResponse.json({ listings: testListings }, { status: 200 })
  }),
  // Support common typo to reduce test flakiness
  http.get('/api/test-lidtings', () => {
    return HttpResponse.json({ listings: testListings }, { status: 200 })
  }),
  http.get('/api/listings', ({ request }) => {
    const url = new URL(request.url)
    const slug = url.searchParams.get('citySlug') || 'unknown'
    return HttpResponse.json({ success: true, data: { listings: [], total: 0 }, city: slug }, { status: 200 })
  }),
]
