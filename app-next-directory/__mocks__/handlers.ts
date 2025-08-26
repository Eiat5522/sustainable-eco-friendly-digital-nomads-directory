import { rest } from 'msw'

export const handlers = [
  rest.get('*/api/featured-listings', (req, res, ctx) => {
    return res(
      ctx.status(200),
      // ctx.delay(0), // uncomment if you want deterministic timing
      ctx.json({
        listings: [],
      }),
    )
  }),

  rest.get('*/api/cities', (req, res, ctx) => {
    return res(
      ctx.json({
        cities: [],
      })
    )
  }),
]

// Optional: factory for richer scenarios in specific tests
export const makeHandlers = (overrides?: {
  listings?: unknown[]
  cities?: unknown[]
}) => [
  rest.get('*/api/featured-listings', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ listings: overrides?.listings ?? [] }))
  }),
  rest.get('*/api/cities', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ cities: overrides?.cities ?? [] }))
  }),
]
