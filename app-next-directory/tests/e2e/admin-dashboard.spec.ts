import { expect, test } from '@playwright/test';
import { loginAs, TestHelpers } from '@tests/utils/test-utils';

const BASE_URL = process.env.E2E_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('Admin Dashboard Integration', () => {
  test.describe('Access Control', () => {
    test('regular user cannot access admin dashboard', async ({ page }) => {
      await loginAs(page, 'user');

      // Try to navigate to admin dashboard - should be redirected
      try {
        await page.goto(`${BASE_URL}/admin`, { waitUntil: 'load', timeout: 15000 });
      } catch {
        // Redirects can cause net::ERR_ABORTED; that's expected for forbidden routes
      }

      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      await expect(page.getByRole('heading', { name: /403 - Access Denied/i })).toBeVisible({
        timeout: 10000,
      });
    });

    test('venue owner cannot access admin dashboard', async ({ page }) => {
      await loginAs(page, 'venueOwner');

      // Try to navigate to admin dashboard - should be redirected
      try {
        await page.goto(`${BASE_URL}/admin`, { waitUntil: 'load', timeout: 15000 });
      } catch {
        // Redirects can cause net::ERR_ABORTED; that's expected for forbidden routes
      }

      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      await expect(page.getByRole('heading', { name: /403 - Access Denied/i })).toBeVisible({
        timeout: 10000,
      });
    });

    test('unauthenticated user is redirected to login', async ({ page }) => {
      await page
        .goto(`${BASE_URL}/admin`, {
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
      const adminSidebar = page.locator('aside[aria-label="Admin navigation"]');
      await expect(adminSidebar.getByRole('link', { name: 'Users' })).toBeVisible();
      await expect(adminSidebar.getByRole('link', { name: 'Listings' })).toBeVisible();
      const backToSiteLink = adminSidebar.locator('a', { hasText: 'Back to Site' }).first();
      await expect(backToSiteLink).toBeVisible();
      await expect(adminSidebar.getByRole('link', { name: 'Settings' })).toBeVisible();
    });

    test('admin navigation links have correct hrefs', async ({ page }) => {
      const adminSidebar = page.locator('aside[aria-label="Admin navigation"]');
      await expect(adminSidebar.getByRole('link', { name: 'Users' })).toHaveAttribute(
        'href',
        '/admin/users'
      );
      await expect(adminSidebar.getByRole('link', { name: 'Listings' })).toHaveAttribute(
        'href',
        '/admin/listings'
      );
      const backToSiteLink = adminSidebar.locator('a', { hasText: 'Back to Site' }).first();
      await expect(backToSiteLink).toHaveAttribute('href', '/');

      await expect(adminSidebar.getByRole('link', { name: 'Settings' })).toHaveAttribute(
        'href',
        '/admin/settings'
      );
    });

    test('page has proper SEO protection', async ({ page }) => {
      const robotsMeta = page.locator('meta[name="robots"]');
      await expect(robotsMeta).toHaveAttribute('content', 'noindex, nofollow');
    });
  });
});
