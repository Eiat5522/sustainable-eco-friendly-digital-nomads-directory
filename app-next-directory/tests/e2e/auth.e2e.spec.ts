import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Authentication System (Playwright)', () => {
  const testEmails: string[] = [];

  test.afterAll(async () => {});

  test('registers a new user and signs them in', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signup`);

    const email = `test+${Date.now()}@example.com`;
    testEmails.push(email);

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123');

    await Promise.all([
      page.waitForURL('**/', { waitUntil: 'domcontentloaded' }),
      page.getByRole('button', { name: /sign up/i }).click(),
    ]);

    await expect(page).toHaveURL(/\/$/);
  });
});
