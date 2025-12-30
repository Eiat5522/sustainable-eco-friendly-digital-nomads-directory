import { expect, test } from '@playwright/test';
import { TestHelpers } from '@tests/utils/test-utils';

const BASE_URL = process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('Admin Dashboard Integration', () => {
  test.describe('Access Control', () => {
    test('regular user cannot access admin dashboard', async ({ page }) => {
      await TestHelpers.loginAsUser(page);

      // Try to navigate to admin dashboard - should be redirected
      await page
        .goto(`${BASE_URL}/admin/dashboard`, {
          waitUntil: 'load',
          timeout: 15000,
        })
        .catch(() => {
          // Navigation might be interrupted by redirect - this is expected
        });

      // Wait for any redirects to settle
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Check that we're NOT on the admin dashboard
      const finalUrl = page.url();
      expect(finalUrl).toContain('/403');
    });

    test('venue owner cannot access admin dashboard', async ({ page }) => {
      await TestHelpers.loginAsVenueOwner(page);

      // Try to navigate to admin dashboard - should be redirected
      await page
        .goto(`${BASE_URL}/admin/dashboard`, {
          waitUntil: 'load',
          timeout: 15000,
        })
        .catch(() => {});

      // Wait for any redirects to settle
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Check that we're NOT on the admin dashboard
      const finalUrl = page.url();
      expect(finalUrl).toContain('/403');
    });

    test('unauthenticated user is redirected to login', async ({ page }) => {
      await page
        .goto(`${BASE_URL}/admin/dashboard`, {
          waitUntil: 'load',
          timeout: 15000,
        })
        .catch(() => {});

      // Wait for redirect to complete
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Should be redirected to login
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  test.describe('Admin Dashboard Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await TestHelpers.loginAsAdmin(page);
      // Wait for the dashboard to load
      await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 });
    });

    test('loads simplified admin dashboard page', async ({ page }) => {
      await expect(page.getByTestId('admin-dashboard')).toBeVisible();
      await expect(page.getByTestId('admin-dashboard-title')).toHaveText('Admin Dashboard');
      await expect(page.getByText(/The admin dashboard is temporarily simplified/)).toBeVisible();
    });

    test('displays admin navigation links', async ({ page }) => {
      await expect(page.getByRole('link', { name: 'Manage Users' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Manage Listings' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Back to Site' })).toBeVisible();
    });

    test('admin navigation links have correct hrefs', async ({ page }) => {
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
      await expect(page.getByRole('link', { name: 'Back to Site' })).toHaveAttribute('href', '/');
    });

    test('page has proper SEO protection', async ({ page }) => {
      const robotsMeta = page.locator('meta[name="robots"]');
      await expect(robotsMeta).toHaveAttribute('content', 'noindex, nofollow');
    });
  });
});
