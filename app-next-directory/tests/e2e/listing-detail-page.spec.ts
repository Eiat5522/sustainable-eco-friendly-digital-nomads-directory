import { expect, type Page, test } from '@playwright/test';

const VALID_SLUG = 'banyan-tree-phuket';
const ERROR_SLUG = 'listing-error-simulated';
const SESSION_ENDPOINT = '**/api/auth/session';

async function waitForPageStable(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {
    // Ignore networkidle timeout, continue if page is loaded
  });
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
    await page.goto(`/listings/${VALID_SLUG}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPageStable(page);

    await expect(page.getByRole('heading', { level: 3, name: 'Banyan Tree Phuket' })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId('gallery-grid')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Amenities' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Reviews \(3\)/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test.skip('shows the 404 page when the slug is missing (covered by Jest)', async ({ page }) => {
    await page.goto('/listings/unknown-slug');
    await waitForPageStable(page);

    await expect(page.getByText('This page could not be found')).toBeVisible();
  });

  test('surfaces the error state when the server throws', async ({ page }) => {
    await page.goto(`/listings/${ERROR_SLUG}`);
    await waitForPageStable(page);

    await expect(page.getByRole('heading', { name: 'Something went wrong!' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
