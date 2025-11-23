import { expect, test } from '@playwright/test';

test.describe('Authentication (Playwright)', () => {
  test('registers a new user and redirects to login', async ({ page, baseURL }) => {
    const to = new URL('/register', baseURL ?? 'http://localhost:3000').toString();
    await page.goto(to);

    const unique = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2, 8)}`;
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill(`test+${unique}@example.com`);
    await page.getByLabel(/password/i).fill('Password_123!Aa');

    await Promise.all([
      page.waitForURL('**/login', { waitUntil: 'domcontentloaded' }),
      page.getByRole('button', { name: /register/i }).click(),
    ]);

    await expect(page).toHaveURL(/\/login$/);
  });
});
