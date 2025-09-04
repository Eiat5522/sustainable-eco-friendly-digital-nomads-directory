// Converted E2E auth test using Jest + jest-playwright
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
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);
    expect(await page.url()).toContain('/login');

    await page.waitForSelector('text=Registration successful', { state: 'visible' });

  });
});
