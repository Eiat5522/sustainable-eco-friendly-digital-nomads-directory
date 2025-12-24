import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

const BASE_URL = process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('RBAC (Playwright)', () => {
  test('regular user cannot access admin routes', async ({ page }) => {
    await loginAs(
      page,
      process.env.E2E_USER_EMAIL ?? 'user@example.com',
      process.env.E2E_USER_PASSWORD ?? 'TestSecurePass123!'
    );

    await page.goto(`${BASE_URL}/admin/dashboard`);
    await expect(page).toHaveURL(/\/403/);
  });

  test('venue owner cannot access admin routes', async ({ page }) => {
    await loginAs(
      page,
      process.env.E2E_VENUE_OWNER_EMAIL ?? 'venue@example.com',
      process.env.E2E_VENUE_OWNER_PASSWORD ?? 'TestSecurePass123!'
    );

    await page.goto(`${BASE_URL}/admin/dashboard`);
    await expect(page).toHaveURL(/\/403/);
  });
  test('admin can access admin routes', async ({ page }) => {
    await loginAs(
      page,
      process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com',
      process.env.E2E_ADMIN_PASSWORD ?? 'TestSecurePass123!'
    );

    await page.goto(`${BASE_URL}/admin/dashboard`);
    await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 10000 });
  });
});
