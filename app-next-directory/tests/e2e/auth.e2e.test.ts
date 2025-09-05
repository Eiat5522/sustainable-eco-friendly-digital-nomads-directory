// @ts-nocheck
// Cleaned E2E auth test for jest-playwright globals
/// <reference types="jest-playwright-preset" />

describe('Authentication System (Jest + jest-playwright)', () => {
  const BASE = process.env.BASE_URL || 'http://localhost:3000';

  beforeEach(async () => {
    await page.goto(BASE);
  });

  it('registers a new user and redirects to login', async () => {
    await page.goto('/register');

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test+${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'password123');

    await Promise.all([
      page.waitForURL('**/login', { waitUntil: 'domcontentloaded' }),
      page.click('button[type="submit"]')
    ]);

    expect(page.url()).toMatch(/\/login$/);
  });
});

