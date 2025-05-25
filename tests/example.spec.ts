import { test, expect } from '@playwright/test';

test('homepage shows correct title', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('https://example.com');

  // Assert that the page title contains "Example Domain"
  await expect(page).toHaveTitle(/Example Domain/);
});

test('homepage contains expected text', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('https://example.com');

  // Assert that the page contains the expected text
  const content = await page.textContent('h1');
  expect(content).toBe('Example Domain');
});
