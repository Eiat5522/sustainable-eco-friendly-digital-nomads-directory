import { rest } from 'msw'

export const handlers = [
  rest.get('/api/featured-listings', (req, res, ctx) => {
    return res(
      ctx.json({
        listings: [],
      })
    )
  }),

  rest.get('/api/cities', (req, res, ctx) => {
    return res(
      ctx.json({
        cities: [],
      })
    )
  }),
]
