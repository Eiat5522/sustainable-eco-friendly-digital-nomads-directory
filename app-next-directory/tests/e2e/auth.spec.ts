import { expect, test } from '@playwright/test';

test.describe('Authentication (Playwright)', () => {
  test('registers a new user and lands on the home page', async ({ page, baseURL }) => {
    const to = new URL('/auth/signup', baseURL ?? 'http://localhost:3000').toString();
    await page.goto(to);

    const unique = `${Date.now()}-${test.info().workerIndex}-${Math.random().toString(36).slice(2, 8)}`;
    await page.getByPlaceholder('Name').fill('Test User');
    await page.getByPlaceholder('Email').fill(`test+${unique}@example.com`);
    await page.getByPlaceholder('Password').fill('Password_123!Aa');

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
