import { expect, type Page, test } from '@playwright/test';

const VALID_SLUG = 'banyan-tree-phuket';
const ERROR_SLUG = 'listing-error-simulated';
const SESSION_ENDPOINT = '**/api/auth/session';

async function waitForPageStable(page: Page) {
  await page.waitForLoadState('networkidle');
}

test.describe('[E2E] Listing detail page', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(SESSION_ENDPOINT, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({}),
      });
    });
  });

  test('renders key sections for a valid slug', async ({ page }) => {
    await page.goto(`/listings/${VALID_SLUG}`);
    await waitForPageStable(page);

    await expect(page.getByRole('heading', { level: 3, name: 'Banyan Tree Phuket' })).toBeVisible();
    await expect(page.getByTestId('gallery-grid')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Amenities' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Reviews \(3\)/i })).toBeVisible();
  });

  test.skip('shows the 404 page when the slug is missing (covered by Jest)', async ({ page }) => {
    await page.goto('/listings/unknown-slug');
    await waitForPageStable(page);

    await expect(page.getByText('This page could not be found')).toBeVisible();
  });

  test('surfaces the error state when the server throws', async ({ page }) => {
    await page.goto(`/listings/${ERROR_SLUG}`);
    await waitForPageStable(page);

    await expect(page.getByRole('heading', { name: 'Unexpected error' })).toBeVisible();
    await expect(page.getByText('Something went wrong. Try again')).toBeVisible();
  });
});
