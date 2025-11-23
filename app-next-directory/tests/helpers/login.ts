import type { Page } from '@playwright/test';

/**
 * Login helper that performs a UI login and saves the authenticated storage state to disk.
 *
 * Usage (inside a Playwright test):
 *   await loginAndSave(page, { email: 'test_customer@example.com', password: 'password' }, 'storageStates/customer.json');
 *
 * TODO: Adjust selectors for your app's login form (input[name="email"], etc.) and the post-login
 * navigation guard (waitForURL) to a route that's stable after login.
 */

export async function loginAndSave(
  page: Page,
  creds: { email: string; password: string },
  storagePath: string
) {
  // Navigate to login page - update path if different
  await page.goto('/login');

  // Fill login form - adjust selectors to match your app
  await page.fill('input[name="email"]', creds.email);
  await page.fill('input[name="password"]', creds.password);
  await page.click('button[type="submit"]');

  // Wait for a stable post-login URL or element. Update the selector as needed.
  await page.waitForURL('**/dashboard', { timeout: 10_000 }).catch(() => {});

  // Save storage state (cookies + localStorage) for reuse in tests
  await page.context().storageState({ path: storagePath });
}
