/**
 * MSW Handlers for Internal API Routes
 *
 * Intercepts HTTP requests to Next.js API routes:
 * - /api/search - Search functionality
 * - /api/listings - Listings CRUD
 * - /api/reviews - Reviews CRUD
 * - /api/categories - Categories
 * - /api/cities - Cities
 * - /api/user/* - User-related endpoints
 * - /api/auth/* - Authentication endpoints
 *
 * @module mocks/handlers/api
 */

import { HttpResponse, http } from 'msw';
import { mockFeaturedVenues } from '@/components/sections/featuredVenuesMockData';
import {
  createTestData,
  getFavoritesForUser,
  getReviewsForListing,
  listCities,
} from '@/tests/helpers/test-data';
import type { AppReview } from '@/types/appView';

const data = createTestData();

const ok = <Body>(body: Body, status = 200) =>
  HttpResponse.json(body as Record<string, unknown>, { status });

/**
 * Internal API route handlers
 */
export const apiHandlers = [
  /**
   * Search API - GET
   */
  http.get('/api/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') ?? '';
    const results = data.listings
      .filter(listing => listing.name.toLowerCase().includes(query.toLowerCase()))
      .map(listing => ({
        id: listing._id,
        name: listing.name,
        city: listing.city.name,
        slug: listing.slug?.current,
      }));

    return ok({
      data: {
        results,
        pagination: {
          total: results.length,
          page: 1,
          totalPages: 1,
          hasMore: false,
        },
      },
    });
  }),

  /**
   * Search API - POST
   */
  http.post('/api/search', async ({ request }) => {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    const query = typeof body?.query === 'string' ? body.query.trim().toLowerCase() : '';
    const results = data.listings
      .filter(listing => listing.name.toLowerCase().includes(query))
      .map(listing => ({
        id: listing._id,
        name: listing.name,
        city: listing.city.name,
        slug: listing.slug?.current,
      }));

    return ok({
      results,
      pagination: {
        total: results.length,
        page: 1,
        totalPages: 1,
        hasMore: false,
      },
    });
  }),

  /**
   * Search suggestions
   */
  http.get('/api/search/suggestions', () => ok([])),

  /**
   * Featured listings
   */
  http.get('/api/featured-listings', () => ok({ listings: mockFeaturedVenues })),

  /**
   * Categories API
   */
  http.get('/api/categories', () => {
    const categories = Array.from(new Set(data.listings.map(listing => listing.type)));
    return ok({ categories });
  }),

  /**
   * Amenities API
   */
  http.get('/api/amenities', () =>
    ok({
      amenities: [
        { name: 'Wi-Fi' },
        { name: 'Air Conditioning' },
        { name: 'Kitchen' },
        { name: 'Parking' },
        { name: 'Garden' },
      ],
    })
  ),

  /**
   * Cities API - List all cities
   */
  http.get('/api/cities', () => {
    const cities = listCities().map(city => ({
      id: city.id,
      name: city.name,
      slug: city.slug,
      country: city.country,
      description: city.description,
      coordinates: city.coordinates,
      highlights: city.highlights,
      listingCount: city.listingIds.length,
    }));
    return ok({ cities });
  }),

  /**
   * Cities API - Get single city by slug
   */
  http.get('/api/cities/:slug', ({ params }) => {
    const { slug } = params as { slug: string };
    const city = listCities().find(entry => entry.slug === slug);
    if (!city) {
      return ok({ success: false, error: 'City not found' }, 404);
    }
    return ok({ success: true, data: city });
  }),

  /**
   * Health check endpoint
   */
  http.get('/api/hello', () => ok({ message: 'Hello' })),

  /**
   * Test listings endpoints
   */
  http.get('/api/test-listings', () => ok({ listings: data.listings })),
  http.get('/api/test-lidtings', () => ok({ listings: data.listings })),

  /**
   * Listings API - GET
   */
  http.get('/api/listings', ({ request }) => {
    const url = new URL(request.url);
    const citySlug = url.searchParams.get('citySlug');
    const listings = citySlug
      ? data.listings.filter(listing => listing.city.slug?.current === citySlug)
      : data.listings;

    return ok({
      success: true,
      data: {
        listings,
        total: listings.length,
        pagination: {
          page: Number(url.searchParams.get('page') ?? '1'),
          limit: Number(url.searchParams.get('limit') ?? listings.length),
          total: listings.length,
          pages: 1,
        },
      },
    });
  }),

  /**
   * Reviews API - POST (Create review)
   */
  http.post('/api/reviews', async ({ request }) => {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }

    return ok(
      {
        success: true,
        data: {
          id: 'review-123',
          rating: body.rating ?? 5,
          comment: body.comment ?? 'Test review',
          createdAt: new Date().toISOString(),
        },
      },
      201
    );
  }),

  /**
   * Reviews API - GET
   */
  http.get('/api/reviews', ({ request }) => {
    const url = new URL(request.url);
    const listingId = url.searchParams.get('listingId') ?? url.searchParams.get('listing');
    const reviews = listingId ? getReviewsForListing(listingId) : data.reviews;
    const average =
      reviews.length === 0
        ? 0
        : reviews.reduce((sum: number, review: AppReview) => sum + review.rating, 0) /
          reviews.length;

    return ok({
      success: true,
      data: {
        reviews,
        totalReviews: reviews.length,
        averageRating: Number(average.toFixed(2)),
      },
    });
  }),

  /**
   * Contact form API
   */
  http.post('/api/contact', async ({ request }) => {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
    return ok({
      success: true,
      message: 'Contact form submitted successfully',
      data: {
        id: 'contact-123',
        name: body.name ?? 'Test User',
        email: body.email ?? 'test@example.com',
        subject: body.subject ?? 'Test Subject',
        message: body.message ?? 'Test message',
      },
    });
  }),

  /**
   * User favorites API - GET
   */
  http.get('/api/user/favorites', () => {
    const user = data.users[0];
    if (!user) {
      return ok({ favorites: [] });
    }

    const favorites = getFavoritesForUser(user.id).map(favorite => {
      const listing = data.listings.find(item => item._id === favorite.listingId);
      return {
        _id: favorite.id,
        createdAt: favorite.createdAt,
        listing: listing
          ? {
              _id: listing._id,
              name: listing.name,
              slug: listing.slug?.current,
              mainImage: {
                asset: { url: `https://images.test/listings/${listing.slug?.current}.jpg` },
              },
              city: { name: listing.city.name },
            }
          : null,
      };
    });
    return ok({ favorites });
  }),

  /**
   * Auth providers API
   */
  http.get('/api/auth/providers', () => {
    return ok({
      google: {
        id: 'google',
        name: 'Google',
        type: 'oauth',
        signinUrl: '/api/auth/signin/google',
        callbackUrl: '/api/auth/callback/google',
      },
      facebook: {
        id: 'facebook',
        name: 'Facebook',
        type: 'oauth',
        signinUrl: '/api/auth/signin/facebook',
        callbackUrl: '/api/auth/callback/facebook',
      },
    });
  }),

  /**
   * User registration API
   */
  http.post('/api/auth/register', async ({ request }) => {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }

    // Simulate successful registration
    return ok(
      {
        success: true,
        emailVerificationRequired: false,
        data: {
          id: 'user-123',
          name: body.name ?? 'Test User',
          email: body.email ?? 'test@example.com',
        },
      },
      201
    );
  }),
];

/**
 * Helper function to override review response mode for testing
 */
export const setReviewsResponse = (
  mode: 'success' | 'unauthorized' | 'forbidden' | 'conflict' | 'error'
) => {
  const reviewsHandler = http.post('/api/reviews', async ({ request }) => {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }

    switch (mode) {
      case 'unauthorized':
        return ok({ error: 'Unauthorized' }, 401);
      case 'forbidden':
        return ok({ error: 'Forbidden' }, 403);
      case 'conflict':
        return ok({ error: 'Review already exists' }, 409);
      case 'error':
        return ok({ error: 'Server error' }, 500);
      default:
        return ok(
          {
            success: true,
            data: {
              id: 'review-123',
              rating: body.rating ?? 5,
              comment: body.comment ?? 'Test review',
              createdAt: new Date().toISOString(),
            },
          },
          201
        );
    }
  });

  return reviewsHandler;
};

/**
 * Helper function to override registration response mode for testing
 */
export const setRegisterResponse = (mode: 'success' | 'error') => {
  const registerHandler = http.post('/api/auth/register', async ({ request }) => {
    let body: Record<string, unknown> = {};
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }

    const name = typeof body.name === 'string' ? body.name : undefined;
    const email = typeof body.email === 'string' ? body.email : undefined;

    switch (mode) {
      case 'error':
        return ok({ error: 'Registration failed' }, 400);
      default:
        return ok(
          {
            success: true,
            emailVerificationRequired: false,
            data: {
              id: 'user-123',
              name: name ?? 'Test User',
              email: email ?? 'test@example.com',
            },
          },
          201
        );
    }
  });

  return registerHandler;
};

export default apiHandlers;
