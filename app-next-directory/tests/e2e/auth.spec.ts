import { expect, test } from '@playwright/test';

test.describe('Authentication (Playwright)', () => {
  test('registers a new user and lands on the home page', async ({ page, baseURL }) => {
    const signupUrl = new URL('/auth/signup', baseURL ?? 'http://localhost:3000').toString();
    await page.goto(signupUrl);

    // If the app redirected us to the home page (e.g. session detected),
    // navigate to the login page and follow the "Create an account" link.
    if (page.url().endsWith('/')) {
      const loginUrl = new URL('/auth/login', baseURL ?? 'http://localhost:3000').toString();
      await page.goto(loginUrl);
      await page.getByRole('link', { name: /create an account/i }).click();
      await page.waitForURL('**/auth/signup');
    }

    const unique = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2, 8)}`;
    await page.getByRole('textbox', { name: /name/i }).fill('Test User');
    await page.getByRole('textbox', { name: /email/i }).fill(`test+${unique}@example.com`);
    await page.getByLabel(/password/i).fill('Password_123!Aa');

    await Promise.all([
      page.waitForURL('**/', { waitUntil: 'domcontentloaded' }),
      page.getByRole('button', { name: /sign up/i }).click(),
    ]);

    await expect(
      page.getByRole('heading', {
        name: /A Curated Directory For Sustainable Digital Nomads/i,
      })
    ).toBeVisible();
  });
});
