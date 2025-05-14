import { expect, type Page, type Locator } from '@playwright/test';

export async function expectLoading(page: Page, isLoading: boolean = true) {
  const loadingSpinner = page.locator('.animate-spin');
  if (isLoading) {
    await expect(loadingSpinner).toBeVisible();
  } else {
    await expect(loadingSpinner).not.toBeVisible();
  }
}

export async function expectToastMessage(page: Page, message: string) {
  const toast = page.locator('.toast-message', { hasText: message });
  await expect(toast).toBeVisible();
}

export async function expectEmptyState(page: Page) {
  const emptyState = page.locator('text="No listings found"');
  await expect(emptyState).toBeVisible();
  await expect(page.locator('text="Try adjusting your filters to see more results."')).toBeVisible();
}

export async function expectValidImage(locator: Locator) {
  // Check if image is loaded and valid
  const img = await locator.evaluate((el: HTMLImageElement) => ({
    naturalWidth: el.naturalWidth,
    naturalHeight: el.naturalHeight,
    currentSrc: el.currentSrc
  }));
  
  expect(img.naturalWidth).toBeGreaterThan(0);
  expect(img.naturalHeight).toBeGreaterThan(0);
  expect(img.currentSrc).toBeTruthy();
}
