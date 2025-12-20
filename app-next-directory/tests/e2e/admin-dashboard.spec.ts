import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

const BASE_URL = process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('Admin Dashboard Integration', () => {
  test.describe('Access Control', () => {
    test('regular user cannot access admin dashboard', async ({ page }) => {
      await loginAs(
        page,
        process.env.E2E_USER_EMAIL ?? 'user@example.com',
        process.env.E2E_USER_PASSWORD ?? 'TestSecurePass123!'
      );

      await page.goto(`${BASE_URL}/admin/dashboard`);
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('venue owner cannot access admin dashboard', async ({ page }) => {
      await loginAs(
        page,
        process.env.E2E_VENUE_OWNER_EMAIL ?? 'venue@example.com',
        process.env.E2E_VENUE_OWNER_PASSWORD ?? 'TestSecurePass123!'
      );

      await page.goto(`${BASE_URL}/admin/dashboard`);
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('unauthenticated user is redirected to login', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/dashboard`);
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  test.describe('Admin Dashboard Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(
        page,
        process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com',
        process.env.E2E_ADMIN_PASSWORD ?? 'TestSecurePass123!'
      );
      await page.goto(`${BASE_URL}/admin/dashboard`);
      // Wait for the dashboard to load after navigation
      await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 });
    });

    test('loads simplified admin dashboard page', async ({ page }) => {
      await expect(page.getByTestId('admin-dashboard')).toBeVisible();
      await expect(page.getByTestId('admin-dashboard-title')).toHaveText('Admin Dashboard');
      await expect(
        page.getByText(/The admin dashboard is temporarily simplified/)
      ).toBeVisible();
    });

    test('displays admin navigation links', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'Manage Users' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Manage Listings' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Back to Site' })).toBeVisible();
    });

    test('admin navigation links have correct hrefs', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'Manage Users' })).toHaveAttribute('href', '/admin/users');
      await expect(page.getByRole('link', { name: 'Manage Listings' })).toHaveAttribute('href', '/admin/listings');
      await expect(page.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/admin/settings');
      await expect(page.getByRole('link', { name: 'Back to Site' })).toHaveAttribute('href', '/');
    });

    test('page has proper SEO protection', async ({ page }) => {
      const robotsMeta = page.locator('meta[name="robots"]');
      await expect(robotsMeta).toHaveAttribute('content', 'noindex, nofollow');
    });
  });
});

