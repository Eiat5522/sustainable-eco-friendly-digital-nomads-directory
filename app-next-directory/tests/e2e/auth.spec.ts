import { test, expect } from '@playwright/test';

test.describe('Authentication (Playwright)', () => {
  test('registers a new user and redirects to login', async ({ page, baseURL }) => {
    const to = new URL('/register', baseURL ?? 'http://localhost:3000').toString();
    await page.goto(to);

    const unique = Date.now();
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test+${unique}@example.com`);
    await page.fill('input[name="password"]', 'password123');

    await Promise.all([
      page.waitForURL('**/login', { waitUntil: 'domcontentloaded' }),
      page.click('button[type="submit"]')
    ]);

    await expect(page).toHaveURL(/\/login$/);
  });
});
