import { test, expect } from '@playwright/test';
import { ROLES } from '../utils/test-data';

test.describe('Role-Specific Tests', () => {
  // Admin role tests
  test.describe('Admin Role', () => {
    test('can access user management', async ({ page }) => {
      await page.goto('/admin/users');
      await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
    });

    test('can modify system settings', async ({ page }) => {
      await page.goto('/admin/settings');
      await expect(page.locator('[data-testid="system-settings"]')).toBeVisible();
    });
  });

  // Editor role tests
  test.describe('Editor Role', () => {
    test('can create and edit content', async ({ page }) => {
      await page.goto('/studio');
      await expect(page.locator('[data-testid="create-content"]')).toBeVisible();
    });

    test('cannot access user management', async ({ page }) => {
      await page.goto('/admin/users');
      await expect(page).toHaveURL(/.*auth/);
    });
  });

  // Contributor role tests
  test.describe('Contributor Role', () => {
    test('can submit content for review', async ({ page }) => {
      await page.goto('/studio');
      await expect(page.locator('[data-testid="submit-for-review"]')).toBeVisible();
    });

    test('cannot publish content directly', async ({ page }) => {
      await page.goto('/studio');
      await expect(page.locator('[data-testid="publish-content"]')).toBeHidden();
    });
  });
});
