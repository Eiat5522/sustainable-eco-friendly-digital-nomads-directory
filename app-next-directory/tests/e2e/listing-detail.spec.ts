import { test, expect } from '@playwright/test';

test.describe('Listing detail page', () => {
  test('navigates from listing card to detail and validates content', async ({ page }) => {
    // 1. Visit listings and click the listing card for e2e-test-listing-1
    await page.goto('/listings');

    // TODO: ensure listing cards have data-testid like `listing-card-e2e-test-listing-1`
    const card = page.getByTestId('listing-card-e2e-test-listing-1');
    await expect(card).toBeVisible();
    await card.click();

    // 2. Assert navigation to the expected detail URL
    await expect(page).toHaveURL(/\/listings\/e2e-test-listing-1/);

    // 3. Verify key elements on detail page
    await expect(page.getByTestId('listing-title')).toBeVisible();
    await expect(page.getByTestId('listing-gallery')).toBeVisible();
    await expect(page.getByTestId('listing-description')).toBeVisible();
    await expect(page.getByTestId('listing-amenities')).toBeVisible();
    await expect(page.getByTestId('listing-reviews')).toBeVisible();

    // 4. Breadcrumb navigates back
    await page.getByTestId('breadcrumb-listings').click();
    await expect(page).toHaveURL('/listings');
  });

  test('direct deep link loads and invalid slug shows 404', async ({ page }) => {
    // Deep link
    await page.goto('/listings/e2e-test-listing-1');
    await expect(page.getByTestId('listing-title')).toBeVisible();

    // Invalid slug -> 404 UI
    await page.goto('/listings/invalid-nonsense-slug');
    // TODO: adjust selector to your 404 UI; common is data-testid='not-found'
    await expect(page.getByTestId('not-found')).toBeVisible();
  });
});
