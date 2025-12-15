import { expect, test } from '@playwright/test';

test.describe('Authentication (Playwright)', () => {
  test('registers a new user and signs them in', async ({ page, baseURL }) => {
    const to = new URL('/auth/signup', baseURL ?? 'http://localhost:3000').toString();
    await page.goto(to);

    const unique = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2, 8)}`;
    const signupSection = page.getByRole('heading', { name: /^sign up$/i }).locator('..');
    await signupSection.getByLabel(/name/i).fill('Test User');
    await signupSection.getByLabel(/email/i).fill(`test+${unique}@example.com`);
    await signupSection.getByLabel(/password/i).fill('Password_123!Aa');

    await Promise.all([
      page.waitForURL('**/', { waitUntil: 'domcontentloaded' }),
      page.getByRole('button', { name: /sign up/i }).click(),
    ]);

    await expect(page).toHaveURL(/\/$/);
  });
});
