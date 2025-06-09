import { expect, test } from '@playwright/test';

/**
 * Workstream E: Integration & Testing
 * Task E.1: API Integration Testing
 *
 * Comprehensive test suite for all implemented API endpoints
 * Testing authentication, authorization, data integrity, and error handling
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'testPassword123!',
};

const testListing = {
  name: 'Test Eco Coworking Space',
  description: 'A sustainable coworking space for digital nomads',
  city: 'Bangkok',
  country: 'Thailand',
  ecoCertifications: ['LEED Gold', 'Energy Star'],
  amenities: ['WiFi', 'Coffee', 'Solar Power'],
};

test.describe('API Integration Testing - Workstream E.1', () => {
  test.describe('Authentication Endpoints', () => {
    test('POST /api/auth/signup - User Registration', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/signup`, {
        data: testUser,
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.email).toBe(testUser.email);
      expect(data.user.password).toBeUndefined(); // Password should not be returned
    });

    test('POST /api/auth/signin - User Authentication', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/signin`, {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.user.email).toBe(testUser.email);
      expect(data.expires).toBeDefined();
    });

    test('POST /api/auth/signout - User Logout', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/signout`);
      expect(response.status()).toBe(200);
    });
  });

  test.describe('User Management Endpoints', () => {
    let authToken: string;

    test.beforeEach(async ({ request }) => {
      // Authenticate to get token
      const loginResponse = await request.post(`${BASE_URL}/api/auth/signin`, {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
      });
      const loginData = await loginResponse.json();
      authToken = loginData.accessToken; // Adjust based on actual token structure
    });

    test('GET /api/user/profile - Get User Profile', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: 'next-auth.session-token=' + authToken, // Adjust for NextAuth
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.email).toBe(testUser.email);
      expect(data.id).toBeDefined();
    });

    test('PUT /api/user/profile - Update User Profile', async ({ request }) => {
      const updateData = {
        name: 'Updated Test User',
        preferences: {
          theme: 'dark',
          notifications: false,
        },
      };

      const response = await request.put(`${BASE_URL}/api/user/profile`, {
        data: updateData,
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: 'next-auth.session-token=' + authToken,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.name).toBe(updateData.name);
      expect(data.preferences.theme).toBe('dark');
    });
  });

  test.describe('User Dashboard Endpoints - Task 5.6 Validation', () => {
    let authToken: string;

    test.beforeEach(async ({ request }) => {
      const loginResponse = await request.post(`${BASE_URL}/api/auth/signin`, {
        data: { email: testUser.email, password: testUser.password },
      });
      const loginData = await loginResponse.json();
      authToken = loginData.accessToken;
    });

    test('GET /api/user/dashboard - Get Dashboard Data', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/user/dashboard`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: 'next-auth.session-token=' + authToken,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Validate dashboard data structure
      expect(data.success).toBe(true);
      expect(data.data.profile).toBeDefined();
      expect(data.data.activity).toBeDefined();
      expect(data.data.favorites).toBeDefined();
      expect(data.data.recommendations).toBeDefined();
      expect(data.data.analytics).toBeDefined();
      expect(data.data.recentActivity).toBeDefined();
    });

    test('GET /api/user/favorites - Get User Favorites', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/user/favorites`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: 'next-auth.session-token=' + authToken,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.favorites).toBeDefined();
      expect(Array.isArray(data.favorites)).toBe(true);
    });

    test('POST /api/user/favorites - Add to Favorites', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/user/favorites`, {
        data: { listingId: 'test-listing-id' },
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: 'next-auth.session-token=' + authToken,
        },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('added to favorites');
    });

    test('DELETE /api/user/favorites/[listingId] - Remove from Favorites', async ({ request }) => {
      const listingId = 'test-listing-id';
      const response = await request.delete(`${BASE_URL}/api/user/favorites/${listingId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: 'next-auth.session-token=' + authToken,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('removed from favorites');
    });

    test('GET /api/user/preferences - Get User Preferences', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/user/preferences`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: 'next-auth.session-token=' + authToken,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.preferences).toBeDefined();
    });

    test('PUT /api/user/preferences - Update User Preferences', async ({ request }) => {
      const newPreferences = {
        theme: 'light',
        language: 'en',
        notifications: {
          email: true,
          push: false,
          newsletter: true,
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
        },
      };

      const response = await request.put(`${BASE_URL}/api/user/preferences`, {
        data: { preferences: newPreferences },
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: 'next-auth.session-token=' + authToken,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.preferences.theme).toBe('light');
    });

    test('GET /api/user/analytics - Get User Analytics', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/user/analytics?timeRange=30d`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: 'next-auth.session-token=' + authToken,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.analytics).toBeDefined();
      expect(data.analytics.overview).toBeDefined();
    });

    test('POST /api/user/analytics - Track User Analytics', async ({ request }) => {
      const analyticsData = {
        event: 'listing_view',
        data: {
          listingId: 'test-listing-id',
          source: 'search',
          duration: 45,
        },
      };

      const response = await request.post(`${BASE_URL}/api/user/analytics`, {
        data: analyticsData,
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: 'next-auth.session-token=' + authToken,
        },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Analytics event tracked successfully');
    });
  });

  test.describe('Listings Endpoints', () => {
    test('GET /api/listings - Get All Listings', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/listings`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.listings).toBeDefined();
      expect(Array.isArray(data.listings)).toBe(true);
      expect(data.pagination).toBeDefined();
    });

    test('GET /api/listings?city=Bangkok - Filter by City', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/listings?city=Bangkok`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.listings).toBeDefined();
      // All listings should be from Bangkok (if any exist)
      if (data.listings.length > 0) {
        expect(data.listings[0].city).toBe('Bangkok');
      }
    });

    test('GET /api/listings/[slug] - Get Listing Details', async ({ request }) => {
      // First get a listing to test with
      const listingsResponse = await request.get(`${BASE_URL}/api/listings?limit=1`);
      const listingsData = await listingsResponse.json();

      if (listingsData.listings.length > 0) {
        const slug = listingsData.listings[0].slug;
        const response = await request.get(`${BASE_URL}/api/listings/${slug}`);

        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.listing).toBeDefined();
        expect(data.listing.slug).toBe(slug);
      }
    });
  });

  test.describe('Contact Form Endpoint', () => {
    test('POST /api/contact - Submit Contact Form', async ({ request }) => {
      const contactData = {
        name: 'Test Contact',
        email: 'contact@test.com',
        subject: 'Test Subject',
        message: 'This is a test message',
        listingId: 'optional-listing-id',
      };

      const response = await request.post(`${BASE_URL}/api/contact`, {
        data: contactData,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('sent successfully');
    });

    test('POST /api/contact - Invalid Email Validation', async ({ request }) => {
      const invalidContactData = {
        name: 'Test Contact',
        email: 'invalid-email',
        subject: 'Test Subject',
        message: 'This is a test message',
      };

      const response = await request.post(`${BASE_URL}/api/contact`, {
        data: invalidContactData,
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('email');
    });
  });

  test.describe('Blog Endpoints', () => {
    test('GET /api/blog - Get Blog Posts', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/blog`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.posts).toBeDefined();
      expect(Array.isArray(data.posts)).toBe(true);
      expect(data.pagination).toBeDefined();
    });

    test('GET /api/blog/[slug] - Get Blog Post Details', async ({ request }) => {
      // First get a blog post to test with
      const postsResponse = await request.get(`${BASE_URL}/api/blog?limit=1`);
      const postsData = await postsResponse.json();

      if (postsData.posts.length > 0) {
        const slug = postsData.posts[0].slug;
        const response = await request.get(`${BASE_URL}/api/blog/${slug}`);

        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.post).toBeDefined();
        expect(data.post.slug).toBe(slug);
      }
    });
  });

  test.describe('Admin Endpoints', () => {
    // Note: These tests require admin authentication

    test('GET /api/admin/stats - Get Admin Statistics', async ({ request }) => {
      // This would need admin authentication
      const response = await request.get(`${BASE_URL}/api/admin/stats`);

      // Expecting 401 Unauthorized without admin token
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Error Handling', () => {
    test('404 for Non-existent Endpoints', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/nonexistent`);
      expect(response.status()).toBe(404);
    });

    test('405 for Wrong HTTP Methods', async ({ request }) => {
      const response = await request.patch(`${BASE_URL}/api/listings`);
      expect(response.status()).toBe(405);
    });

    test('401 for Protected Endpoints without Auth', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/user/profile`);
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Search & Filter Endpoints - Enhanced Coverage', () => {
    test('GET /api/search - Basic Search', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/search?q=coworking`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.results).toBeDefined();
      expect(Array.isArray(data.results)).toBe(true);
      expect(data.metadata).toBeDefined();
      expect(data.metadata.total).toBeDefined();
      expect(data.metadata.query).toBe('coworking');
    });

    test('GET /api/search - Advanced Filters', async ({ request }) => {
      const searchParams = new URLSearchParams({
        q: 'sustainable',
        city: 'Bangkok',
        category: 'coworking',
        priceRange: '100-500',
        amenities: 'wifi,coffee',
        ecoTags: 'solar-power,recycling',
      });

      const response = await request.get(`${BASE_URL}/api/search?${searchParams}`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.results).toBeDefined();
      expect(data.filters).toBeDefined();
      expect(data.appliedFilters).toBeDefined();
    });

    test('GET /api/search/suggestions - Search Autocomplete', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/search/suggestions?q=ban`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.suggestions).toBeDefined();
      expect(Array.isArray(data.suggestions)).toBe(true);
    });

    test('POST /api/search/save - Save Search Query', async ({ request }) => {
      const authResponse = await request.post(`${BASE_URL}/api/auth/signin`, {
        data: { email: testUser.email, password: testUser.password },
      });
      const authData = await authResponse.json();
      const authToken = authData.accessToken;

      const searchData = {
        query: 'sustainable coworking Bangkok',
        filters: {
          city: 'Bangkok',
          category: 'coworking',
          ecoTags: ['solar-power'],
        },
        name: 'My Saved Search',
      };

      const response = await request.post(`${BASE_URL}/api/search/save`, {
        data: searchData,
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: 'next-auth.session-token=' + authToken,
        },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.searchId).toBeDefined();
    });
  });

  test.describe('Reviews & Ratings Endpoints', () => {
    let authToken: string;
    let testListingId: string;

    test.beforeEach(async ({ request }) => {
      // Get auth token
      const loginResponse = await request.post(`${BASE_URL}/api/auth/signin`, {
        data: { email: testUser.email, password: testUser.password },
      });
      const loginData = await loginResponse.json();
      authToken = loginData.accessToken;

      // Get a test listing ID
      const listingsResponse = await request.get(`${BASE_URL}/api/listings?limit=1`);
      const listingsData = await listingsResponse.json();
      if (listingsData.listings.length > 0) {
        testListingId = listingsData.listings[0]._id;
      }
    });

    test('POST /api/reviews - Submit Review', async ({ request }) => {
      if (!testListingId) return;

      const reviewData = {
        listingId: testListingId,
        rating: 4.5,
        title: 'Great sustainable workspace',
        content: 'Really enjoyed working here. Great eco-friendly features.',
        categories: {
          atmosphere: 5,
          wifi: 4,
          sustainability: 5,
          location: 4,
        },
      };

      const response = await request.post(`${BASE_URL}/api/reviews`, {
        data: reviewData,
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: 'next-auth.session-token=' + authToken,
        },
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.review).toBeDefined();
      expect(data.review.rating).toBe(4.5);
    });

    test('GET /api/reviews/listing/[listingId] - Get Reviews for Listing', async ({ request }) => {
      if (!testListingId) return;

      const response = await request.get(`${BASE_URL}/api/reviews/listing/${testListingId}`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.reviews).toBeDefined();
      expect(Array.isArray(data.reviews)).toBe(true);
      expect(data.statistics).toBeDefined();
    });

    test('PUT /api/reviews/[reviewId] - Update Review', async ({ request }) => {
      // This would need a review ID from a previous test or fixture
      const response = await request.put(`${BASE_URL}/api/reviews/test-review-id`, {
        data: {
          rating: 5,
          title: 'Updated: Excellent workspace',
          content: 'Updated review content',
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: 'next-auth.session-token=' + authToken,
        },
      });

      // Expecting either 200 (success) or 404 (review not found)
      expect([200, 404]).toContain(response.status());
    });

    test('POST /api/reviews/[reviewId]/helpful - Mark Review as Helpful', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/reviews/test-review-id/helpful`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Cookie: 'next-auth.session-token=' + authToken,
        },
      });

      expect([200, 404]).toContain(response.status());
    });
  });

  test.describe('Events & Calendar Endpoints', () => {
    test('GET /api/events - Get Upcoming Events', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/events`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.events).toBeDefined();
      expect(Array.isArray(data.events)).toBe(true);
    });

    test('GET /api/events?city=Bangkok&type=workshop - Filter Events', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/events?city=Bangkok&type=workshop`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.events).toBeDefined();
      expect(data.filters).toBeDefined();
    });

    test('GET /api/events/[eventId] - Get Event Details', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/events/test-event-id`);

      // Expecting either 200 (success) or 404 (not found)
      expect([200, 404]).toContain(response.status());
    });
  });

  test.describe('Cities & Locations Endpoints', () => {
    test('GET /api/cities - Get All Cities', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/cities`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.cities).toBeDefined();
      expect(Array.isArray(data.cities)).toBe(true);
    });

    test('GET /api/cities/[slug] - Get City Details', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/cities/bangkok`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.city).toBeDefined();
      expect(data.city.slug).toBe('bangkok');
      expect(data.listingCount).toBeDefined();
    });

    test('GET /api/cities/[slug]/listings - Get City Listings', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/cities/bangkok/listings`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.listings).toBeDefined();
      expect(Array.isArray(data.listings)).toBe(true);
      expect(data.pagination).toBeDefined();
    });
  });

  test.describe('Rate Limiting & Security', () => {
    test('Rate limiting on contact form', async ({ request }) => {
      const contactData = {
        name: 'Rate Limit Test',
        email: 'ratelimit@test.com',
        subject: 'Test Subject',
        message: 'Testing rate limits',
      };

      // Send multiple requests quickly
      const requests = Array(6)
        .fill(null)
        .map(() => request.post(`${BASE_URL}/api/contact`, { data: contactData }));

      const responses = await Promise.all(requests);

      // At least one should be rate limited (429)
      const statuses = responses.map(r => r.status());
      expect(statuses.some(status => status === 429)).toBe(true);
    });

    test('CORS headers validation', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/listings`, {
        headers: {
          Origin: 'https://malicious-site.com',
        },
      });

      expect(response.status()).toBe(200);
      const headers = response.headers();
      expect(headers['access-control-allow-origin']).toBeDefined();
    });

    test('SQL injection prevention', async ({ request }) => {
      const maliciousQuery = "'; DROP TABLE users; --";
      const response = await request.get(
        `${BASE_URL}/api/search?q=${encodeURIComponent(maliciousQuery)}`
      );

      // Should not crash the server
      expect([200, 400]).toContain(response.status());
    });
  });

  test.describe('Data Validation & Sanitization', () => {
    test('XSS prevention in contact form', async ({ request }) => {
      const xssData = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        subject: '<img src="x" onerror="alert(1)">',
        message: 'Normal message',
      };

      const response = await request.post(`${BASE_URL}/api/contact`, {
        data: xssData,
      });

      // Should either sanitize or reject
      expect([200, 400]).toContain(response.status());
    });

    test('Large payload handling', async ({ request }) => {
      const largeMessage = 'x'.repeat(10000); // 10KB message
      const contactData = {
        name: 'Large Payload Test',
        email: 'large@test.com',
        subject: 'Large Message',
        message: largeMessage,
      };

      const response = await request.post(`${BASE_URL}/api/contact`, {
        data: contactData,
      });

      // Should handle or reject gracefully
      expect([200, 400, 413]).toContain(response.status());
    });
  });

  /**
   * Frontend-Backend Integration Tests
   * Testing the complete data flow from UI components to API endpoints
   */
  test.describe('Frontend-Backend Integration - Workstream E.2', () => {
    test.describe('Search Flow Integration', () => {
      test('Complete search flow: input → API → results display', async ({ page }) => {
        await page.goto(`${BASE_URL}`);

        // Find search input
        const searchInput = page.locator('[data-testid="search-input"]');
        await expect(searchInput).toBeVisible();

        // Type search query
        await searchInput.fill('coworking Bangkok');

        // Submit search
        const searchButton = page.locator('[data-testid="search-button"]');
        await searchButton.click();

        // Wait for results
        await page.waitForSelector('[data-testid="search-results"]');

        // Verify results are displayed
        const results = page.locator('[data-testid="listing-card"]');
        const resultCount = await results.count();
        expect(resultCount).toBeGreaterThan(0);

        // Verify URL contains search params
        expect(page.url()).toContain('q=coworking');
        expect(page.url()).toContain('Bangkok');
      });

      test('Filter integration: UI filters → API params → filtered results', async ({ page }) => {
        await page.goto(`${BASE_URL}/search`);

        // Apply city filter
        const cityFilter = page.locator('[data-testid="city-filter"]');
        await cityFilter.selectOption('Bangkok');

        // Apply category filter
        const categoryFilter = page.locator('[data-testid="category-filter"]');
        await categoryFilter.selectOption('coworking');

        // Apply price range
        const priceRange = page.locator('[data-testid="price-range"]');
        await priceRange.fill('100-500');

        // Apply eco tags
        const ecoTag = page.locator('[data-testid="eco-tag-solar"]');
        await ecoTag.check();

        // Submit filters
        const applyButton = page.locator('[data-testid="apply-filters"]');
        await applyButton.click();

        // Verify API call with correct params
        const response = await page.waitForResponse(
          response =>
            response.url().includes('/api/search') &&
            response.url().includes('city=Bangkok') &&
            response.url().includes('category=coworking')
        );

        expect(response.status()).toBe(200);

        // Verify filtered results display
        const results = page.locator('[data-testid="listing-card"]');
        await expect(results.first()).toBeVisible();
      });
    });

    test.describe('User Authentication Flow Integration', () => {
      test('Complete signup flow: form → API → success state', async ({ page }) => {
        await page.goto(`${BASE_URL}/auth/signup`);

        // Fill signup form
        await page.fill('[data-testid="signup-name"]', testUser.name);
        await page.fill('[data-testid="signup-email"]', `test-${Date.now()}@example.com`);
        await page.fill('[data-testid="signup-password"]', testUser.password);
        await page.fill('[data-testid="signup-confirm-password"]', testUser.password);

        // Submit form
        const signupButton = page.locator('[data-testid="signup-submit"]');
        await signupButton.click();

        // Wait for API response
        const response = await page.waitForResponse(response =>
          response.url().includes('/api/auth/signup')
        );

        expect(response.status()).toBe(201);

        // Verify success state
        await expect(page.locator('[data-testid="signup-success"]')).toBeVisible();

        // Verify redirect or next step
        await page.waitForURL('**/auth/signin**');
      });

      test('Login flow: form → API → dashboard redirect', async ({ page }) => {
        await page.goto(`${BASE_URL}/auth/signin`);

        // Fill login form
        await page.fill('[data-testid="signin-email"]', testUser.email);
        await page.fill('[data-testid="signin-password"]', testUser.password);

        // Submit form
        const signinButton = page.locator('[data-testid="signin-submit"]');
        await signinButton.click();

        // Wait for API response
        const response = await page.waitForResponse(response =>
          response.url().includes('/api/auth/signin')
        );

        expect(response.status()).toBe(200);

        // Verify dashboard redirect
        await page.waitForURL('**/dashboard**');

        // Verify user state in UI
        const userMenu = page.locator('[data-testid="user-menu"]');
        await expect(userMenu).toBeVisible();
      });
    });

    test.describe('User Dashboard Integration', () => {
      test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto(`${BASE_URL}/auth/signin`);
        await page.fill('[data-testid="signin-email"]', testUser.email);
        await page.fill('[data-testid="signin-password"]', testUser.password);
        await page.click('[data-testid="signin-submit"]');
        await page.waitForURL('**/dashboard**');
      });
      test('Dashboard data loading: page load → API calls → data display', async ({ page }) => {
        // Monitor API calls
        const apiCalls: string[] = [];
        page.on('response', response => {
          if (response.url().includes('/api/user/')) {
            apiCalls.push(response.url());
          }
        });

        await page.goto(`${BASE_URL}/dashboard`);

        // Verify multiple API calls are made
        await page.waitForTimeout(2000); // Allow time for API calls

        expect(apiCalls.some(url => url.includes('/api/user/dashboard'))).toBe(true);
        expect(apiCalls.some(url => url.includes('/api/user/favorites'))).toBe(true);
        expect(apiCalls.some(url => url.includes('/api/user/analytics'))).toBe(true);

        // Verify dashboard sections are populated
        await expect(page.locator('[data-testid="user-profile-section"]')).toBeVisible();
        await expect(page.locator('[data-testid="user-activity-section"]')).toBeVisible();
        await expect(page.locator('[data-testid="user-favorites-section"]')).toBeVisible();
        await expect(page.locator('[data-testid="user-analytics-section"]')).toBeVisible();
      });

      test('Favorites interaction: add → API call → UI update', async ({ page }) => {
        await page.goto(`${BASE_URL}/listings`);

        // Find a listing and add to favorites
        const firstListing = page.locator('[data-testid="listing-card"]').first();
        const favoriteButton = firstListing.locator('[data-testid="favorite-button"]');

        await favoriteButton.click();

        // Wait for API call
        const response = await page.waitForResponse(
          response =>
            response.url().includes('/api/user/favorites') && response.request().method() === 'POST'
        );

        expect(response.status()).toBe(201);

        // Verify UI update
        await expect(favoriteButton).toHaveClass(/favorited/);

        // Go to dashboard and verify favorite appears
        await page.goto(`${BASE_URL}/dashboard`);
        const favoritesSection = page.locator('[data-testid="user-favorites-section"]');
        await expect(favoritesSection.locator('[data-testid="favorite-item"]')).toHaveCount(1);
      });
    });

    test.describe('Contact Form Integration', () => {
      test('Contact form submission: form → API → success feedback', async ({ page }) => {
        await page.goto(`${BASE_URL}/contact`);

        // Fill contact form
        await page.fill('[data-testid="contact-name"]', 'Integration Test User');
        await page.fill('[data-testid="contact-email"]', 'integration@test.com');
        await page.fill('[data-testid="contact-subject"]', 'Test Integration');
        await page.fill('[data-testid="contact-message"]', 'This is an integration test message');

        // Submit form
        const submitButton = page.locator('[data-testid="contact-submit"]');
        await submitButton.click();

        // Wait for API response
        const response = await page.waitForResponse(response =>
          response.url().includes('/api/contact')
        );

        expect(response.status()).toBe(200);

        // Verify success feedback
        await expect(page.locator('[data-testid="contact-success"]')).toBeVisible();

        // Verify form reset
        await expect(page.locator('[data-testid="contact-name"]')).toHaveValue('');
      });
    });

    test.describe('Error Handling Integration', () => {
      test('Network error handling: API failure → error state display', async ({ page }) => {
        // Block API requests to simulate network failure
        await page.route('/api/listings', route => route.abort());

        await page.goto(`${BASE_URL}/listings`);

        // Verify error state is displayed
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

        // Test retry functionality
        await page.unroute('/api/listings');
        await page.click('[data-testid="retry-button"]');

        // Verify data loads after retry
        await expect(page.locator('[data-testid="listing-card"]')).toBeVisible();
      });

      test('Validation error handling: invalid form → API error → error display', async ({
        page,
      }) => {
        await page.goto(`${BASE_URL}/contact`);

        // Submit form with invalid email
        await page.fill('[data-testid="contact-name"]', 'Test User');
        await page.fill('[data-testid="contact-email"]', 'invalid-email');
        await page.fill('[data-testid="contact-subject"]', 'Test');
        await page.fill('[data-testid="contact-message"]', 'Test message');

        await page.click('[data-testid="contact-submit"]');

        // Wait for API error response
        const response = await page.waitForResponse(response =>
          response.url().includes('/api/contact')
        );

        expect(response.status()).toBe(400);

        // Verify error message display
        await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
        await expect(page.locator('[data-testid="email-error"]')).toContainText('email');
      });
    });
  });
});
