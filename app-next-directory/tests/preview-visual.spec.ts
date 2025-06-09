import { test, expect } from '@playwright/test';

// Visual regression tests for preview mode
test.describe('Preview Mode Visual Tests', () => {
  const VIEWPORTS = [
    { width: 375, height: 667, name: 'mobile' },    // iPhone SE
    { width: 1280, height: 720, name: 'desktop' }   // Standard desktop
  ];

  test.beforeEach(async ({ page }) => {
    // Enable preview mode via API route
    const response = await page.goto('/api/preview?redirect=/');
    expect(response?.ok()).toBeTruthy();
  });

  for (const viewport of VIEWPORTS) {
    test(`preview banner visual consistency - ${viewport.name}`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto('/');

      // Wait for preview banner to be fully rendered
      const previewBanner = await page.getByTestId('preview-banner');
      await expect(previewBanner).toBeVisible();

      // Take screenshot of preview banner
      await expect(page.getByTestId('preview-banner')).toHaveScreenshot(`preview-banner-${viewport.name}.png`, {
        mask: [page.getByText(/last updated/i)] // Mask dynamic timestamp
      });
    });

    test(`draft listing visual indicators - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Navigate to draft listing
      await page.goto('/listings/test-draft-listing');

      // Wait for content to load
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText('Draft')).toBeVisible();

      // Take screenshot of the header area with draft indicator
      await expect(page.locator('header')).toHaveScreenshot(`draft-listing-header-${viewport.name}.png`, {
        mask: [page.getByText(/last updated/i)]
      });

      // Take screenshot of the full listing content
      await expect(page).toHaveScreenshot(`draft-listing-full-${viewport.name}.png`, {
        fullPage: true,
        mask: [
          page.getByText(/last updated/i),
          page.getByTestId('dynamic-content')  // Mask any dynamic content
        ]
      });
    });

    test(`draft city visual indicators - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Navigate to draft city
      await page.goto('/city/test-draft-city');

      // Wait for content to load
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText('Draft')).toBeVisible();

      // Take screenshot of the header area with draft indicator
      await expect(page.locator('header')).toHaveScreenshot(`draft-city-header-${viewport.name}.png`, {
        mask: [page.getByText(/last updated/i)]
      });

      // Take screenshot of the full city page
      await expect(page).toHaveScreenshot(`draft-city-full-${viewport.name}.png`, {
        fullPage: true,
        mask: [
          page.getByText(/last updated/i),
          page.getByTestId('dynamic-content')
        ]
      });
    });

    test(`preview mode exit transition - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto('/');

      // Take screenshot before exit
      await expect(page).toHaveScreenshot(`before-exit-preview-${viewport.name}.png`, {
        mask: [page.getByText(/last updated/i)]
      });

      // Click exit preview button
      const exitButton = await page.getByRole('button', { name: /exit preview/i });
      await exitButton.click();

      // Wait for preview banner to disappear
      await expect(page.getByTestId('preview-banner')).not.toBeVisible();

      // Take screenshot after exit
      await expect(page).toHaveScreenshot(`after-exit-preview-${viewport.name}.png`);
    });
  }
});
