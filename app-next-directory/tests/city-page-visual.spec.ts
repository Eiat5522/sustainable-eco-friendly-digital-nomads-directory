import { expect, test } from '@playwright/test';

test.describe('City Page Visual Tests', () => {
  test('should visually match the Koh Samui city page', async ({ page }) => {
    // Navigate to the city page for Koh Samui
    // Assuming your local dev server runs on a port Playwright can access,
    // and the base URL is configured in playwright.config.ts
    await page.goto('/city/koh-samui');

    // Optional: Wait for a specific element (e.g., the city heading) to ensure the page
    // is fully loaded before capturing the screenshot.

    // Take a screenshot and compare it to the snapshot.
    // The first time this test runs, it will create a snapshot named 'city-koh-samui-page.png'.
    // Subsequent runs will compare against this snapshot.
    // You can add options like { maxDiffPixels: 100 } to allow for minor differences.
    await expect(page).toHaveScreenshot('city-koh-samui-page.png');
  });

  // TODO(visual-tests): Add scenarios for error states (e.g., a missing city slug)
  // once the UI for those flows has stabilized.
});
