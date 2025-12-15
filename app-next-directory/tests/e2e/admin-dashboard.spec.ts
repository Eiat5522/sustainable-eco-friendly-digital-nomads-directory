import { expect, test } from '@playwright/test';

import { loginAs } from './helpers/auth';

const BASE_URL = process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('[E2E] Admin dashboard', () => {
  test('unauthenticated users are redirected away from admin', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/dashboard`);
    await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=%2Fadmin%2Fdashboard/);
  });

  test('non-admin users cannot access the admin dashboard', async ({ page }) => {
    await loginAs(
      page,
      process.env.E2E_USER_EMAIL ?? 'e2e-test@example.com',
      process.env.E2E_USER_PASSWORD ?? 'password123'
    );

    await page.goto(`${BASE_URL}/admin/dashboard`);
    await expect(page).toHaveURL(/\/\?error=unauthorized_access/);
  });

  test('admin users can access the admin dashboard', async ({ page }) => {
    await loginAs(
      page,
      process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com',
      process.env.E2E_ADMIN_PASSWORD ?? 'password123'
    );

    await page.goto(`${BASE_URL}/admin/dashboard`);

    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Manage Users' })).toHaveAttribute(
      'href',
      '/admin/users'
    );
    await expect(page.getByRole('link', { name: 'Manage Listings' })).toHaveAttribute(
      'href',
      '/admin/listings'
    );
    await expect(page.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/admin/settings'
    );
  });

  test('admin dashboard has SEO protection', async ({ page }) => {
    await loginAs(
      page,
      process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com',
      process.env.E2E_ADMIN_PASSWORD ?? 'password123'
    );

    await page.goto(`${BASE_URL}/admin/dashboard`);

    const robotsMeta = page.locator('meta[name="robots"]');
    await expect(robotsMeta).toHaveAttribute('content', /noindex/i);
    await expect(robotsMeta).toHaveAttribute('content', /nofollow/i);
  });
});

