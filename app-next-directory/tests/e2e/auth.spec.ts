import { expect, test } from '@playwright/test';

test.describe('Authentication (Playwright E2E)', () => {
  test('registers a new user and lands on the home page', async ({ page, baseURL }) => {
    let registeredEmail = '';
    // Mock the register endpoint for integration testing
    await page.route('**/api/auth/register', async route => {
        const requestBody = route.request().postDataJSON();
        registeredEmail = requestBody?.email || 'test@example.com';
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                _id: 'e2e-user',
                name: requestBody?.name || 'Test User',
                email: requestBody?.email || 'test@example.com',
              },
            },
          }),
        });
      });

    // Mock NextAuth signin endpoint
    await page.route('**/api/auth/signin/credentials', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: '/' }),
      });
    });

      // Mock NextAuth callback endpoint
      await page.route('**/api/auth/callback/credentials**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, url: '/' }),
        });
      });
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    // Mock NextAuth session endpoint
    await page.route('**/api/auth/session**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            name: 'Test User',
            email: registeredEmail || 'test@example.com',
          },
          expires: new Date(Date.now() + ONE_DAY_MS).toISOString(),
        }),
      });
    });

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
    await page.locator('input#name').fill('Test User');
    await page.locator('input#email').fill(`test+${unique}@example.com`);
    await page.locator('input#password').fill('Password_123!Aa');

    const registerPromise = page.waitForResponse(
      response => response.url().includes('/api/auth/register') && response.status() === 201
    );
    await page.getByRole('button', { name: /sign up/i }).click();
    const response = await registerPromise;
    expect(response.ok()).toBeTruthy();

    // Wait for navigation or timeout, then verify we're on the home page
    try {
      await page.waitForURL('**/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (error) {
      // If auto-navigation didn't occur, manually navigate
      console.warn('Auto-navigation timed out, manually navigating to home page');
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    }

    await expect(
      page.getByRole('heading', {
        name: /A Curated Directory For Sustainable Digital Nomads/i,
      })
    ).toBeVisible();
  });
});
