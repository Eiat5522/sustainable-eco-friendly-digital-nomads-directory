import { expect, test } from '@playwright/test';
import { TestHelpers } from '../utils/test-utils';

test.describe('Listings API', () => {
  let createdListingId: string;

  // Status Code Tests
  test.describe('status codes and error paths', () => {
    test('returns 400 for invalid query parameters', async ({ request }) => {
      const response = await request.get('/api/listings?page=0&limit=invalid');
      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error.code).toBe('VALIDATION_ERROR');
    });

    test('returns 404 for non-existent listing', async ({ request }) => {
      const response = await request.get('/api/listings/non-existent-id');
      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error.error.code).toBe('NOT_FOUND');
    });

    test('returns 401 for unauthorized access', async ({ request }) => {
      const response = await request.post('/api/listings/some-id/moderate', {
        data: { status: 'approved' },
      });
      expect(response.status()).toBe(401);
    });

    test('returns 403 for insufficient permissions', async ({ page }) => {
      // Login as regular user
      await TestHelpers.loginAsUser(page);

      const response = await TestHelpers.makeAuthenticatedRequest(page, '/api/admin/listings', {
        method: 'GET',
      });
      expect(response.status()).toBe(403);
    });
  });

  // Input Validation Tests
  test.describe('input validation', () => {
    test('validates required fields in POST request', async ({ page }) => {
      await TestHelpers.loginAsVenueOwner(page);

      const response = await TestHelpers.makeAuthenticatedRequest(page, '/api/listings', {
        method: 'POST',
        data: {
          // Missing required fields
          description: 'Test description',
        },
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error.details).toContainEqual(expect.objectContaining({ field: 'name' }));
    });

    test('validates data types', async ({ page }) => {
      await TestHelpers.loginAsVenueOwner(page);

      const response = await TestHelpers.makeAuthenticatedRequest(page, '/api/listings', {
        method: 'POST',
        data: {
          name: 'Test Listing',
          description: 'Test description',
          priceRange: 123, // Should be string
          category: ['invalid-array'], // Should be string
          coordinates: 'invalid', // Should be object
        },
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error.details).toContainEqual(
        expect.objectContaining({
          field: 'priceRange',
          type: 'string',
        })
      );
    });
  });

  // CRUD Operations Tests
  test.describe('CRUD operations', () => {
    test('creates, updates, and deletes listing', async ({ page }) => {
      await TestHelpers.loginAsVenueOwner(page);

      // Create
      const createResponse = await TestHelpers.makeAuthenticatedRequest(page, '/api/listings', {
        method: 'POST',
        data: {
          name: 'CRUD Test Listing',
          description: 'Test Description',
          category: 'coworking',
          city: 'Bangkok',
          ecoTags: ['solar-powered'],
        },
      });

      expect(createResponse.ok()).toBeTruthy();
      const { listing } = await createResponse.json();
      createdListingId = listing.id;

      // Update
      const updateResponse = await TestHelpers.makeAuthenticatedRequest(
        page,
        `/api/listings/${createdListingId}`,
        {
          method: 'PUT',
          data: {
            name: 'Updated CRUD Test Listing',
            description: 'Updated Description',
          },
        }
      );

      expect(updateResponse.ok()).toBeTruthy();
      const updatedListing = await updateResponse.json();
      expect(updatedListing.listing.name).toBe('Updated CRUD Test Listing');

      // Verify Update
      const getResponse = await request.get(`/api/listings/${createdListingId}`);
      expect(getResponse.ok()).toBeTruthy();
      const getListing = await getResponse.json();
      expect(getListing.listing.name).toBe('Updated CRUD Test Listing');

      // Delete
      const deleteResponse = await TestHelpers.makeAuthenticatedRequest(
        page,
        `/api/listings/${createdListingId}`,
        {
          method: 'DELETE',
        }
      );
      expect(deleteResponse.ok()).toBeTruthy();

      // Verify Deletion
      const verifyDeleteResponse = await request.get(`/api/listings/${createdListingId}`);
      expect(verifyDeleteResponse.status()).toBe(404);
    });
  });

  // Sorting and Ordering Tests
  test.describe('sorting and ordering', () => {
    test('default sort order is newest first', async ({ request }) => {
      const response = await request.get('/api/listings');
      const data = await response.json();

      // Verify dates are in descending order
      const dates = data.listings.map(l => new Date(l.createdAt));
      const isSorted = dates.every((date, i) => i === 0 || date <= dates[i - 1]);
      expect(isSorted).toBeTruthy();
    });

    test('supports custom sort orders', async ({ request }) => {
      const sortFields = ['price', 'name', 'rating'];
      const sortOrders = ['asc', 'desc'];

      for (const field of sortFields) {
        for (const order of sortOrders) {
          const response = await request.get(`/api/listings?sort=${field}&order=${order}`);
          expect(response.ok()).toBeTruthy();

          const data = await response.json();
          const values = data.listings.map(l => l[field]);

          const isSorted = values.every((val, i) => {
            if (i === 0) return true;
            return order === 'asc' ? val >= values[i - 1] : val <= values[i - 1];
          });

          expect(isSorted).toBeTruthy();
        }
      }
    });
  });

  // Rate Limiting Tests
  test.describe('rate limiting', () => {
    test('enforces rate limits', async ({ request }) => {
      const requests = Array(150)
        .fill(null)
        .map(() => request.get('/api/listings'));

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status() === 429);
      expect(rateLimited).toBeTruthy();
    });

    test('includes rate limit headers', async ({ request }) => {
      const response = await request.get('/api/listings');
      expect(response.headers()['x-ratelimit-limit']).toBeDefined();
      expect(response.headers()['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers()['x-ratelimit-reset']).toBeDefined();
    });
  });
});
