import type { Page } from '@playwright/test';
import { e2eDiscoveryListings, e2eFilterMetadata } from '@/data/e2e/discovery-fixtures';

export async function mockDiscoveryMetadata(page: Page) {
  const { cities, categories, amenities } = e2eFilterMetadata;

  await page.route('**/api/cities**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ cities }),
    });
  });

  await page.route('**/api/categories**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ categories }),
    });
  });

  await page.route('**/api/amenities**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ amenities }),
    });
  });
}

export const discoveryListings = e2eDiscoveryListings;
