import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Authentication System (Playwright)', () => {
  test('registers a new user and redirects to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test+${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'password123');

    await Promise.all([
      page.waitForURL('**/login', { waitUntil: 'domcontentloaded' }),
      page.click('button[type="submit"]'),
    ]);

    await expect(page).toHaveURL(/\/login$/);
  });
});

