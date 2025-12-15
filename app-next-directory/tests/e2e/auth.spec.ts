import { expect, test } from '@playwright/test';

test.describe('Authentication (Playwright)', () => {
  test('registers a new user and signs them in', async ({ page, baseURL }) => {
    const to = new URL('/auth/signup', baseURL ?? 'http://localhost:3000').toString();
    await page.goto(to);

    const unique = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2, 8)}`;
    const signupButton = page.getByRole('button', { name: /^sign up$/i }).first();
    const signupForm = page.locator('form').filter({ has: signupButton }).first();

    await signupForm.getByLabel('Name', { exact: true }).fill('Test User');
    await signupForm.getByLabel('Email', { exact: true }).fill(`test+${unique}@example.com`);
    await signupForm.getByLabel('Password', { exact: true }).fill('Password_123!Aa');

    await Promise.all([
      page.waitForURL('**/', { waitUntil: 'domcontentloaded' }),
      signupButton.click(),
    ]);

    await expect(page).toHaveURL(/\/$/);
  });
});
