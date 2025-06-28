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

  // Input Validation & Authorization Tests
  test.describe('input validation and authorization', () => {
    /**
     * @description Ensures only premium users can create listings.
     */
    test('returns 403 if user is not premium', async ({ page }) => {
      await TestHelpers.loginAsUser(page); // Not premium
      const response = await TestHelpers.makeAuthenticatedRequest(page, '/api/listings', {
        method: 'POST',
        data: {
          name: 'Test Listing',
          cityId: 'city-1',
          category: 'coworking',
          description_short: 'Short desc for test',
          description_long: 'Long description for test that is definitely more than fifty characters long for validation.',
          imageUrl: 'https://example.com/image.jpg',
          slug: 'test-listing-non-premium'
        },
      });
      expect(response.status()).toBe(403);
    });

    /**
     * @description Helper for premium user login (uses venue owner as premium).
     */
    async function loginAsPremium(page: any) {
      // If venue owner is considered premium in your system, reuse this helper.
      await TestHelpers.loginAsVenueOwner(page);
    }

    /**
     * @description Validates required fields in POST request.
     */
    test('validates required fields in POST request', async ({ page }) => {
      await loginAsPremium(page);

      const response = await TestHelpers.makeAuthenticatedRequest(page, '/api/listings', {
        method: 'POST',
        data: {
          // Missing required fields
          name: '',
          cityId: '',
          category: '',
          description_short: '',
          description_long: '',
          imageUrl: '',
          slug: ''
        },
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['name'] }),
          expect.objectContaining({ path: ['cityId'] }),
          expect.objectContaining({ path: ['category'] }),
          expect.objectContaining({ path: ['description_short'] }),
          expect.objectContaining({ path: ['description_long'] }),
          expect.objectContaining({ path: ['imageUrl'] }),
          expect.objectContaining({ path: ['slug'] }),
        ])
      );
    });

    /**
     * @description Validates duplicate slug returns 409.
     */
    test('returns 409 for duplicate slug', async ({ page }) => {
      await loginAsPremium(page);

      const listingData = {
        name: 'Duplicate Slug Listing',
        cityId: 'city-dup',
        category: 'coworking',
        description_short: 'Short desc for duplicate',
        description_long: 'Long description for duplicate slug test that is definitely more than fifty characters long.',
        imageUrl: 'https://example.com/dup.jpg',
        slug: 'duplicate-slug'
      };

      // First creation should succeed
      const firstResponse = await TestHelpers.makeAuthenticatedRequest(page, '/api/listings', {
        method: 'POST',
        data: listingData,
      });
      expect(firstResponse.status()).toBe(200);

      // Second creation with same slug should fail
      const secondResponse = await TestHelpers.makeAuthenticatedRequest(page, '/api/listings', {
        method: 'POST',
        data: listingData,
      });
      expect(secondResponse.status()).toBe(409);
    });

    /**
     * @description Validates success case with all required and optional fields.
     */
    test('creates listing with all required and optional fields', async ({ page }) => {
      await loginAsPremium(page);

      const listingData = {
        name: 'Full Listing',
        cityId: 'city-full',
        category: 'coworking',
        description_short: 'Short desc for full listing',
        description_long: 'Long description for full listing that is definitely more than fifty characters long.',
        imageUrl: 'https://example.com/full.jpg',
        slug: 'full-listing',
        eco_features: ['solar', 'recycled-materials'],
        amenities: ['wifi', 'coffee']
      };

      const response = await TestHelpers.makeAuthenticatedRequest(page, '/api/listings', {
        method: 'POST',
        data: listingData,
      });

      expect(response.status()).toBe(200);
      const created = await response.json();
      expect(created.name).toBe(listingData.name);
      expect(created.eco_features).toEqual(listingData.eco_features);
      expect(created.amenities).toEqual(listingData.amenities);
    });
  });

  // CRUD Operations Tests
  test.describe('CRUD operations', () => {
    test('creates, updates, and deletes listing', async ({ page, request }) => {
      await TestHelpers.loginAsVenueOwner(page);

      // Create
      const createResponse = await TestHelpers.makeAuthenticatedRequest(page, '/api/listings', {
        method: 'POST',
        data: {
          name: 'CRUD Test Listing',
          cityId: 'city-crud',
          category: 'coworking',
          description_short: 'Short desc for CRUD',
          description_long: 'Long description for CRUD test that is definitely more than fifty characters long.',
          imageUrl: 'https://example.com/crud.jpg',
          slug: 'crud-listing'
        },
      });

      expect(createResponse.ok()).toBeTruthy();
      const { id: createdId } = await createResponse.json();
      createdListingId = createdId;

      // Update
      const updateResponse = await TestHelpers.makeAuthenticatedRequest(
        page,
        `/api/listings/${createdListingId}`,
        {
          method: 'PUT',
          data: {
            name: 'Updated CRUD Test Listing',
            description_short: 'Updated Short Desc',
            description_long: 'Updated long description for CRUD test that is definitely more than fifty characters long.',
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
      const dates = data.listings.map((l: { createdAt: string }) => new Date(l.createdAt));
      const isSorted = dates.every((date: Date, i: number) => i === 0 || date <= dates[i - 1]);
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
          const values = data.listings.map((l: Record<string, any>) => l[field]);

          const isSorted = values.every((val: any, i: number) => {
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
