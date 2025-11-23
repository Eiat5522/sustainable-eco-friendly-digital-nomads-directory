import { test as base } from '@playwright/test';

// Extend the base test to include custom fixtures
export const test = base.extend({
  // Custom fixture for authenticated user
  authenticatedPage: async ({ page }, use) => {
    // Navigate to login page
    await page.goto('/login');

    // Login with test user
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for successful login
    await page.waitForURL('/');

    await use(page);
  },

  // Custom fixture for admin user
  adminPage: async ({ page }, use) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/');

    await use(page);
  },

  // Custom fixture for venue owner
  venueOwnerPage: async ({ page }, use) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'venueowner@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/');

    await use(page);
  }
});

export { expect } from '@playwright/test';
