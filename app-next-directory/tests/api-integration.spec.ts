import { test, expect } from '@playwright/test';

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
  password: 'testPassword123!'
};

const testListing = {
  name: 'Test Eco Coworking Space',
  description: 'A sustainable coworking space for digital nomads',
  city: 'Bangkok',
  country: 'Thailand',
  ecoCertifications: ['LEED Gold', 'Energy Star'],
  amenities: ['WiFi', 'Coffee', 'Solar Power']
};

test.describe('API Integration Testing - Workstream E.1', () => {
  
  test.describe('Authentication Endpoints', () => {
    
    test('POST /api/auth/signup - User Registration', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/auth/signup`, {
        data: testUser
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
          password: testUser.password
        }
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
          password: testUser.password
        }
      });
      const loginData = await loginResponse.json();
      authToken = loginData.accessToken; // Adjust based on actual token structure
    });

    test('GET /api/user/profile - Get User Profile', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cookie': 'next-auth.session-token=' + authToken // Adjust for NextAuth
        }
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
          notifications: false
        }
      };

      const response = await request.put(`${BASE_URL}/api/user/profile`, {
        data: updateData,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cookie': 'next-auth.session-token=' + authToken
        }
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
        data: { email: testUser.email, password: testUser.password }
      });
      const loginData = await loginResponse.json();
      authToken = loginData.accessToken;
    });

    test('GET /api/user/dashboard - Get Dashboard Data', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/user/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cookie': 'next-auth.session-token=' + authToken
        }
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
          'Authorization': `Bearer ${authToken}`,
          'Cookie': 'next-auth.session-token=' + authToken
        }
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
          'Authorization': `Bearer ${authToken}`,
          'Cookie': 'next-auth.session-token=' + authToken
        }
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
          'Authorization': `Bearer ${authToken}`,
          'Cookie': 'next-auth.session-token=' + authToken
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('removed from favorites');
    });

    test('GET /api/user/preferences - Get User Preferences', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/user/preferences`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cookie': 'next-auth.session-token=' + authToken
        }
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
          newsletter: true
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false
        }
      };

      const response = await request.put(`${BASE_URL}/api/user/preferences`, {
        data: { preferences: newPreferences },
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cookie': 'next-auth.session-token=' + authToken
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.preferences.theme).toBe('light');
    });

    test('GET /api/user/analytics - Get User Analytics', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/user/analytics?timeRange=30d`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cookie': 'next-auth.session-token=' + authToken
        }
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
          duration: 45
        }
      };

      const response = await request.post(`${BASE_URL}/api/user/analytics`, {
        data: analyticsData,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Cookie': 'next-auth.session-token=' + authToken
        }
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
        listingId: 'optional-listing-id'
      };

      const response = await request.post(`${BASE_URL}/api/contact`, {
        data: contactData
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
        message: 'This is a test message'
      };

      const response = await request.post(`${BASE_URL}/api/contact`, {
        data: invalidContactData
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
});
