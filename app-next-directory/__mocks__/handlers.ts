import { http, HttpResponse } from 'msw'
import {
  createTestData,
  getFavoritesForUser,
  getReviewsForListing,
  listCities
} from '@/tests/helpers/test-data'
import { mockFeaturedVenues } from '@/components/sections/featuredVenuesMockData'

const data = createTestData()

const ok = <Body>(body: Body, status = 200) => HttpResponse.json(body as any, { status })

export const handlers = [
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('q') ?? ''
    const results = data.listings
      .filter((listing) => listing.name.toLowerCase().includes(query.toLowerCase()))
      .map((listing) => ({
        id: listing._id,
        name: listing.name,
        city: listing.city.name,
        slug: listing.slug?.current
      }))

    return ok({
      data: {
        results,
        pagination: {
          total: results.length,
          page: 1,
          totalPages: 1,
          hasMore: false
        }
      }
    })
  }),

  http.post('/api/search', async ({ request }) => {
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    const query = typeof body?.query === 'string' ? body.query.trim().toLowerCase() : ''
    const results = data.listings
      .filter((listing) => listing.name.toLowerCase().includes(query))
      .map((listing) => ({
        id: listing._id,
        name: listing.name,
        city: listing.city.name,
        slug: listing.slug?.current
      }))

    console.log('MSW POST /api/search hit with query:', query)

    return ok({
      results,
      pagination: {
        total: results.length,
        page: 1,
        totalPages: 1,
        hasMore: false
      }
    })
  }),

  http.get('/api/search/suggestions', () => ok([])),

  http.get('/api/featured-listings', () => ok({ listings: mockFeaturedVenues })),

  http.get('/api/categories', () => {
    const categories = Array.from(new Set(data.listings.map((listing) => listing.type)))
    return ok({ categories })
  }),

  http.get('/api/amenities', () => ok({ amenities: [] })),

  http.get('/api/cities', () => {
    const cities = listCities().map((city) => ({
      id: city.id,
      name: city.name,
      slug: city.slug,
      country: city.country,
      description: city.description,
      coordinates: city.coordinates,
      highlights: city.highlights,
      listingCount: city.listingIds.length
    }))
    return ok({ cities })
  }),

  http.get('/api/cities/:slug', ({ params }) => {
    const { slug } = params as { slug: string }
    const city = listCities().find((entry) => entry.slug === slug)
    if (!city) {
      return ok({ success: false, error: 'City not found' }, 404)
    }
    return ok({ success: true, data: city })
  }),

  http.get('/api/hello', () => ok({ message: 'Hello' })),

  http.get('/api/test-listings', () => ok({ listings: data.listings })),
  http.get('/api/test-lidtings', () => ok({ listings: data.listings })),

  http.get('/api/listings', ({ request }) => {
    const url = new URL(request.url)
    const citySlug = url.searchParams.get('citySlug')
    const listings = citySlug
      ? data.listings.filter((listing) => listing.city.slug?.current === citySlug)
      : data.listings

    return ok({
      success: true,
      data: {
        listings,
        total: listings.length,
        pagination: {
          page: Number(url.searchParams.get('page') ?? '1'),
          limit: Number(url.searchParams.get('limit') ?? listings.length),
          total: listings.length,
          pages: 1
        }
      }
    })
  }),

  http.post('/api/reviews', async ({ request }) => {
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    return ok({
      success: true,
      data: {
        id: 'review-123',
        rating: body.rating ?? 5,
        comment: body.comment ?? 'Test review',
        createdAt: new Date().toISOString()
      }
    }, 201)
  }),

  http.get('/api/reviews', ({ request }) => {
    const url = new URL(request.url)
    const listingId = url.searchParams.get('listingId') ?? url.searchParams.get('listing')
    const reviews = listingId ? getReviewsForListing(listingId) : data.reviews
    const average =
      reviews.length === 0
        ? 0
        : reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

    return ok({
      success: true,
      data: {
        reviews,
        totalReviews: reviews.length,
        averageRating: Number(average.toFixed(2))
      }
    })
  }),

  http.post('/api/contact', async ({ request }) => {
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    return ok({
      success: true,
      message: 'Contact form submitted successfully',
      data: {
        id: 'contact-123',
        name: body.name ?? 'Test User',
        email: body.email ?? 'test@example.com',
        subject: body.subject ?? 'Test Subject',
        message: body.message ?? 'Test message'
      }
    })
  }),

  http.get('/api/user/favorites', () => {
    const user = data.users[0]
    const favorites = getFavoritesForUser(user.id).map((favorite) => {
      const listing = data.listings.find((item) => item._id === favorite.listingId)
      return {
        _id: favorite.id,
        createdAt: favorite.createdAt,
        listing: listing
          ? {
              _id: listing._id,
              name: listing.name,
              slug: listing.slug?.current,
              mainImage: { asset: { url: `https://images.test/listings/${listing.slug?.current}.jpg` } },
              city: { name: listing.city.name }
            }
          : null
      }
    })
    return ok({ favorites })
  }),

  // Auth endpoints
  http.get('/api/auth/providers', () => {
    return ok({
      google: {
        id: 'google',
        name: 'Google',
        type: 'oauth',
        signinUrl: '/api/auth/signin/google',
        callbackUrl: '/api/auth/callback/google'
      },
      facebook: {
        id: 'facebook', 
        name: 'Facebook',
        type: 'oauth',
        signinUrl: '/api/auth/signin/facebook',
        callbackUrl: '/api/auth/callback/facebook'
      }
    })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }
    
    // Simulate successful registration
    return ok({
      success: true,
      emailVerificationRequired: false,
      data: {
        id: 'user-123',
        name: body.name ?? 'Test User',
        email: body.email ?? 'test@example.com'
      }
    }, 201)
  }),
]

export const setReviewsResponse = (mode: 'success' | 'unauthorized' | 'forbidden' | 'conflict' | 'error') => {
  const reviewsHandler = http.post('/api/reviews', async ({ request }) => {
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    switch (mode) {
      case 'unauthorized':
        return ok({ error: 'Unauthorized' }, 401)
      case 'forbidden':
        return ok({ error: 'Forbidden' }, 403)
      case 'conflict':
        return ok({ error: 'Review already exists' }, 409)
      case 'error':
        return ok({ error: 'Server error' }, 500)
      default:
        return ok({
          success: true,
          data: {
            id: 'review-123',
            rating: body.rating ?? 5,
            comment: body.comment ?? 'Test review',
            createdAt: new Date().toISOString()
          }
        }, 201)
    }
  })

  return reviewsHandler
}

export const setRegisterResponse = (mode: 'success' | 'error') => {
  const registerHandler = http.post('/api/auth/register', async ({ request }) => {
    let body: any = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    switch (mode) {
      case 'error':
        return ok({ error: 'Registration failed' }, 400)
      default:
        return ok({
          success: true,
          emailVerificationRequired: false,
          data: {
            id: 'user-123',
            name: body.name ?? 'Test User',
            email: body.email ?? 'test@example.com'
          }
        }, 201)
    }
  })

  return registerHandler
}
