import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';
import { mockListings } from './test-data';

// Define fixture types
type MockListingPage = {
  page: Page;
  performSearch: (searchTerm: string) => Promise<void>;
  listings: typeof mockListings;
};

// Extend the base test type with our custom fixtures
export const test = base.extend<{ mockListingPage: MockListingPage }>({
  // Set up a mock listing page with search functionality
  mockListingPage: async ({ page }, use) => {
    const parsedTimeout = Number(process.env.TEST_TIMEOUT);
    const responseTimeout = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 10000;

    // Mock the API response for listings
    await page.route('**/api/test-listings', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ listings: mockListings }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
    await page.route('**/api/search**', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ listings: mockListings }),
        headers: { 'content-type': 'application/json' },
      });
    });

    // Create a helper function to perform search
    const performSearch = async (searchTerm: string) => {
      const responsePromise = page.waitForResponse(
        resp => resp.url().includes('/api/search') && resp.status() === 200,
        { timeout: responseTimeout }
      );
      await page.fill('[data-testid="search-input"]', searchTerm);
      await responsePromise;
    };

    // Create an object with the mock page and helper functions
    const mockPage = {
      page,
      performSearch,
      listings: mockListings,
    };

    await use(mockPage);
  },
});

export { expect } from '@playwright/test';
