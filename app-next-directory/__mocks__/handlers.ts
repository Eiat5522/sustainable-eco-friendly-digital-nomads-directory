import { http } from 'msw'

export const handlers = [
  // Search endpoints to silence unhandled warnings where tests don't mock fetch
  http.get('*/api/search', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ data: { results: [], pagination: { total: 0, page: 1, totalPages: 0, hasMore: false } } })
    )
  }),
  http.post('*/api/search', async (req, res, ctx) => {
    // Minimal functional stub that mirrors the request body shape
    let body: any = {};
    try {
      body = await req.json();
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
    return res(
      ctx.status(200),
      ctx.json({
        results,
        pagination: { total: results.length, page: 1, totalPages: 1, hasMore: false }
      })
    )
  }),
  http.get('*/api/search/suggestions', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ suggestions: [] })
    )
  }),
  http.get('*/api/featured-listings', (req, res, ctx) => {
    return res(
      ctx.status(200),
      // ctx.delay(0), // uncomment if you want deterministic timing
      ctx.json({
        listings: [],
      }),
    )
  }),

  http.get('*/api/cities', (req, res, ctx) => {
    return res(
      ctx.json({
        cities: [],
      })
    )
  }),
  http.get('*/api/cities/:slug', (req, res, ctx) => {
    const { slug } = req.params as any
    return res(
      ctx.status(200),
      ctx.json({ success: true, data: { id: slug, name: slug, slug } })
    )
  }),
  http.get('*/api/listings', (req, res, ctx) => {
    const url = new URL(req.url)
    const slug = url.searchParams.get('citySlug') || 'unknown'
    return res(
      ctx.status(200),
      ctx.json({ success: true, data: { listings: [], total: 0 }, city: slug })
    )
  }),
]

// Optional: factory for richer scenarios in specific tests
export const makeHandlers = (overrides?: {
  listings?: unknown[]
  cities?: unknown[]
}) => [
  http.get('*/api/featured-listings', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ listings: overrides?.listings ?? [] }))
  }),
  http.get('*/api/cities', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ cities: overrides?.cities ?? [] }))
  }),
]
