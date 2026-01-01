import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

const BASE_URL = process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('RBAC (Playwright)', () => {
  test('regular user cannot access admin routes', async ({ page }) => {
    await loginAs(
      page,
      process.env.E2E_USER_EMAIL ?? 'user@example.com',
      process.env.E2E_USER_PASSWORD ?? 'adminpass123'
    );

    const res = await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });

    // Accept either a 401/403 status, an explicit unauthorized page, or a redirect to a signin/login page
    const status = res?.status() ?? 0;
    if ([401, 403].includes(status)) {
      expect([401, 403]).toContain(status);
      return;
    }

    await expect(page).toHaveURL(/\/(unauthorized|login|api\/auth\/signin)(?:[?#].*)?$/);
  });

  test('venue owner cannot access admin routes', async ({ page }) => {
    await loginAs(
      page,
      process.env.E2E_VENUE_OWNER_EMAIL ?? 'venue@example.com',
      process.env.E2E_VENUE_OWNER_PASSWORD ?? 'adminpass123'
    );

    const res = await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    const status = res?.status() ?? 0;
    if ([401, 403].includes(status)) {
      expect([401, 403]).toContain(status);
      return;
    }
    await expect(page).toHaveURL(/\/(unauthorized|login|api\/auth\/signin)(?:[?#].*)?$/);
  });
  test('admin can access admin routes', async ({ page }) => {
    await loginAs(
      page,
      process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com',
      process.env.E2E_ADMIN_PASSWORD ?? 'adminpass123'
    );

    const res = await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });

    // If the server responded with a 401/403 that's unexpected for an admin
    const status = res?.status() ?? 0;
    expect(status).not.toBe(401);
    expect(status).not.toBe(403);

    // Wait for either an element marker for the admin dashboard or the admin URL
    const dashboardLocator = page.getByTestId?.('admin-dashboard');
    if (dashboardLocator) {
      await expect(dashboardLocator).toBeVisible({ timeout: 10000 });
      return;
    }

    await expect(page).toHaveURL(/\/admin(\/dashboard)?(?:[?#].*)?$/);
  });
});
