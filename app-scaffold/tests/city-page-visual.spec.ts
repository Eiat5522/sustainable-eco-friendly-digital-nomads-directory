import { expect, test } from '@playwright/test';

test.describe('City Page Visual Tests', () => {
  test('should visually match the Koh Samui city page', async ({ page }) => {
    // Navigate to the city page for Koh Samui
    // Assuming your local dev server runs on a port Playwright can access,
    // and the base URL is configured in playwright.config.ts
    await page.goto('/city/koh-samui');

    // Optional: Wait for a specific element to ensure the page is fully loaded
    // For example, if you have a unique h1 for the city name:
    // await expect(page.getByRole('heading', { name: /Koh Samui/i })).toBeVisible();

    // Take a screenshot and compare it to the snapshot.
    // The first time this test runs, it will create a snapshot named 'city-koh-samui-page.png'.
    // Subsequent runs will compare against this snapshot.
    // You can add options like { maxDiffPixels: 100 } to allow for minor differences.
    await expect(page).toHaveScreenshot('city-koh-samui-page.png');
  });

  // You can add more visual tests for other cities or different states here.
  // For example, a city page that is expected to show an error or a specific message:
  // test('should display an error for a non-existent city', async ({ page }) => {
  //   await page.goto('/city/non-existent-city-slug');
  //   await expect(page.getByText('City not found')).toBeVisible();
  //   await expect(page).toHaveScreenshot('city-not-found-page.png');
  // });
});
