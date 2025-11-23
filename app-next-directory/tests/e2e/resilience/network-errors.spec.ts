import { expect, test } from '@playwright/test';
import { discoveryListings, mockDiscoveryMetadata } from '../utils/discovery-helpers';

test.describe('Discovery network resilience', () => {
  test.beforeEach(async ({ page }) => {
    await mockDiscoveryMetadata(page);
  });

  test('shows retry affordance when the search API fails and recovers on retry', async ({
    page,
  }) => {
    await page.goto('/search/results?e2eScenario=fail-once&q=coworking');

    const errorState = page.getByTestId('search-error-state');
    await expect(errorState).toBeVisible();
    const retryButton = page.getByTestId('search-retry-button');
    await expect(retryButton).toBeVisible();

    await Promise.all([
      page.waitForURL('**/search/results**', { waitUntil: 'networkidle' }),
      retryButton.click(),
    ]);

    await expect(page).toHaveURL(/retry=1/);
    const expectedListing = discoveryListings.find(
      listing => listing.slug === 'green-cowork-bangkok'
    );
    if (expectedListing) {
      await expect(page.getByRole('link', { name: expectedListing.name })).toBeVisible();
    }
  });

  test('handles a simulated timeout and eventually renders results', async ({ page }) => {
    await page.goto('/search/results?e2eScenario=timeout&q=eco');

    const ecoListing = discoveryListings.find(listing => listing.slug === 'eco-stay-chiang-mai');
    if (ecoListing) {
      await expect(page.getByRole('link', { name: ecoListing.name })).toBeVisible();
    }
  });
});
