import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

const BASE_URL = process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('RBAC (Playwright)', () => {
  test('regular user cannot access admin routes', async ({ page }) => {
    await loginAs(
      page,
      process.env.E2E_USER_EMAIL ?? 'user@example.com',
      process.env.E2E_USER_PASSWORD ?? 'password123'
    );

    await page.goto(`${BASE_URL}/admin`);
    await expect(page.getByText(/access denied/i)).toBeVisible({ timeout: 10000 });
  });

  test('venue owner cannot access admin routes', async ({ page }) => {
    await loginAs(
      page,
      process.env.E2E_VENUE_OWNER_EMAIL ?? 'venue@example.com',
      process.env.E2E_VENUE_OWNER_PASSWORD ?? 'password123'
    );

    await page.goto(`${BASE_URL}/admin`);
    await expect(page.getByText(/access denied/i)).toBeVisible({ timeout: 10000 });
  });
  test('admin can access admin routes', async ({ page }) => {
  await loginAs(
    page,
    process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com',
    process.env.E2E_ADMIN_PASSWORD ?? 'adminpassword'
  );

  await page.goto(`${BASE_URL}/admin`);
  await expect(page.getByText(/admin dashboard/i)).toBeVisible({ timeout: 10000 });
});
});

