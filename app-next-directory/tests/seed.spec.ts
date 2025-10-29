import { test } from '@playwright/test';

/**
 * Seed test data for E2E runs.
 *
 * This test uses Playwright's request fixture to call server-side test-only endpoints.
 * Replace the /api/test/* endpoints below with the real test-only endpoints your app exposes,
 * or implement those endpoints in a test-only branch/environment.
 */

test.describe('Test group', () => {
  test('seed', async ({ request }) => {
    // Base URL is taken from Playwright config baseURL or overridden via env.
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

    const testUsers = [
      { email: 'test_customer@example.com', password: 'password', role: 'customer', name: 'E2E Customer' },
      { email: 'test_owner@example.com', password: 'password', role: 'owner', name: 'E2E Owner' },
      { email: 'test_admin@example.com', password: 'password', role: 'admin', name: 'E2E Admin' },
    ];

    const testListings = [
      {
        title: 'e2e: Test Listing 1',
        slug: 'e2e-test-listing-1',
        city: 'Testville',
        category: 'Coworking',
        ecoTags: ['solar-powered'],
        description: 'Automated seed listing for E2E tests',
      },
      {
        title: 'e2e: Test Listing 2',
        slug: 'e2e-test-listing-2',
        city: 'Testville',
        category: 'Retreat',
        ecoTags: ['organic-food'],
        description: 'Second seed listing for filter tests',
      },
    ];

    const post = async (path: string, data: any) => {
      const url = `${baseURL}${path}`;
      const res = await request.post(url, { data });
      if (!res.ok()) {
        const txt = await res.text().catch(() => '<no body>');
        throw new Error(`Seeding failed for ${path}: ${res.status()} - ${txt}`);
      }
      return res.json().catch(() => ({}));
    };

    // 1) Create users
    for (const u of testUsers) {
      // TODO: Replace '/api/test/users' with the project's actual test-creation endpoint.
      console.log(`Creating user ${u.email}`);
      await post('/api/test/users', u);
    }

    // 2) Create listings
    for (const listing of testListings) {
      // TODO: Replace '/api/test/listings' with the project's actual test-creation endpoint.
      console.log(`Creating listing ${listing.slug}`);
      await post('/api/test/listings', listing);
    }

    // 3) Optionally create related resources (favorites, reviews)
    // Example:
    // await post('/api/test/favorites', { userEmail: 'test_customer@example.com', listingSlug: 'e2e-test-listing-1' });

    console.log('Seeding complete. Created users and listings with e2e: prefix.');
  });
});
