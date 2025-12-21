import { expect, test } from '@playwright/test';

test.describe('City page tabs and map markers', () => {
  test('renders city overview and related listings with correct links', async ({ page }) => {
    await page.goto('/cities/bangkok');

    await expect(page.getByRole('heading', { level: 1, name: 'Bangkok' })).toBeVisible();
    await expect(page.getByTestId('city-about-section')).toBeVisible();
    await expect(page.getByTestId('city-listings-section')).toBeVisible();

    const listingLink = page.getByRole('link', { name: 'Green Cowork Bangkok' });
    await expect(listingLink).toHaveAttribute('href', '/listings/green-cowork-bangkok');
  });
});
