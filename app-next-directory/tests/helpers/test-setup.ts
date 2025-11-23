import { test as base } from '@playwright/test';
import { type Page } from '@playwright/test';
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
    // Mock the API response for listings
    await page.route('**/api/test-listings', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify(mockListings)
      });
    });

    // Create a helper function to perform search
    const performSearch = async (searchTerm: string) => {
      await page.fill('[data-testid="search-input"]', searchTerm);
      // Wait for the search results to update
      await page.waitForTimeout(500);
    };

    // Create an object with the mock page and helper functions
    const mockPage = {
      page,
      performSearch,
      listings: mockListings
    };

    await use(mockPage);
  }
});

export { expect } from '@playwright/test';
