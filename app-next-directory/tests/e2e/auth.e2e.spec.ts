import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Authentication System (Playwright)', () => {
  const testEmails: string[] = [];

  test.afterAll(async () => {
    // TODO: Implement cleanup logic here.
    // This might involve calling a backend endpoint to delete the users by email.
    console.log('Cleaning up test users:', testEmails);
  });

  test('registers a new user and redirects to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);

    const email = `test+${Date.now()}@example.com`;
    testEmails.push(email);

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123');

    await Promise.all([
      page.waitForURL('**/login', { waitUntil: 'domcontentloaded' }),
      page.click('button[type="submit"]'),
    ]);

    await expect(page).toHaveURL(/\/login$/);
  });
});

