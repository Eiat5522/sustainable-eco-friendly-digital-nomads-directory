import { expect, test } from '@playwright/test';

const FEATURED_ENDPOINT = '**/api/featured-listings';
const SESSION_ENDPOINT = '**/api/auth/session';

test.describe('[E2E] Network resilience', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(SESSION_ENDPOINT, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });
  });

  test('recovers featured listings after retrying a failed request', async ({ page }) => {
    let requestCount = 0;

    await page.route(FEATURED_ENDPOINT, async (route) => {
      requestCount += 1;

      if (requestCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          listings: [
            {
              id: 'resilient-hub',
              name: 'Resilient Eco Hub',
              slug: 'resilient-eco-hub',
              city: 'Lisbon',
              ecoFocusTags: ['Solar Powered'],
              amenityNames: ['High-Speed WiFi'],
              featured: true,
            },
          ],
        }),
      });
    });

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Featured Sustainable Venues' })).toBeVisible();

    const errorAlert = page
      .getByRole('alert')
      .filter({ hasText: 'Failed to load featured listings. Please try again.' });
    await expect(errorAlert).toBeVisible();
    const retryButton = page.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();

    await retryButton.click();

    await expect(page.getByRole('heading', { level: 3, name: 'Resilient Eco Hub' })).toBeVisible();
    await expect(errorAlert).not.toBeVisible();

    expect(requestCount).toBeGreaterThanOrEqual(2);
  });
});
