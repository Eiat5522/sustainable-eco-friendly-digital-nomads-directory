import { test, expect } from '@playwright/test';

// Preview Mode Test Suite
test.describe('Preview Mode Functionality', () => {
  // Store the preview cookie for reuse
  let previewCookie: { name: string; value: string };

  test.beforeEach(async ({ page }) => {
    // Enable preview mode via API route
    const response = await page.goto('/api/preview?redirect=/');
    expect(response?.ok()).toBeTruthy();

    // Store preview cookie
    const cookies = await page.context().cookies();
    previewCookie = cookies.find(cookie => cookie.name === '__previewMode') || { name: '', value: '' };
    expect(previewCookie.name).toBeTruthy();
  });

  test('should show preview banner when preview mode is active', async ({ page }) => {
    await page.goto('/');

    const previewBanner = await page.getByTestId('preview-banner');
    await expect(previewBanner).toBeVisible();

    const exitButton = await previewBanner.getByRole('button', { name: /exit preview/i });
    await expect(exitButton).toBeVisible();
  });

  test('should display draft content in preview mode', async ({ page }) => {
    // Assuming we have a draft listing with ID 'test-draft-listing'
    await page.goto('/listings/test-draft-listing');

    // Check for draft indicator
    const draftIndicator = await page.getByText('Draft');
    await expect(draftIndicator).toBeVisible();

    // Verify draft content is visible
    const listingTitle = await page.getByRole('heading', { level: 1 });
    await expect(listingTitle).not.toBeEmpty();
  });

  test('should exit preview mode when clicking exit button', async ({ page }) => {
    await page.goto('/');

    // Click exit preview button
    const exitButton = await page.getByRole('button', { name: /exit preview/i });
    await exitButton.click();

    // Verify preview banner is gone
    const previewBanner = await page.getByTestId('preview-banner');
    await expect(previewBanner).not.toBeVisible();

    // Verify preview cookie is removed
    const cookies = await page.context().cookies();
    const previewCookieAfterExit = cookies.find(cookie => cookie.name === '__previewMode');
    expect(previewCookieAfterExit).toBeUndefined();
  });

  test('should handle invalid preview token gracefully', async ({ page }) => {
    // Attempt to enable preview mode with invalid token
    const response = await page.goto('/api/preview?token=invalid');
    expect(response?.status()).toBe(401);
  });

  test('should preserve preview mode across navigation', async ({ page }) => {
    await page.goto('/');

    // Navigate to different pages
    await page.getByRole('link', { name: /listings/i }).click();
    let previewBanner = await page.getByTestId('preview-banner');
    await expect(previewBanner).toBeVisible();

    await page.goBack();
    previewBanner = await page.getByTestId('preview-banner');
    await expect(previewBanner).toBeVisible();
  });

  test('should display draft city content in preview mode', async ({ page }) => {
    // Assuming we have a draft city with slug 'test-draft-city'
    await page.goto('/city/test-draft-city');

    // Verify draft content is visible
    const cityTitle = await page.getByRole('heading', { level: 1 });
    await expect(cityTitle).not.toBeEmpty();

    const draftIndicator = await page.getByText('Draft');
    await expect(draftIndicator).toBeVisible();
  });
});
