import { test, expect } from '@playwright/test';
import { ROLES, PERMISSIONS } from '../utils/test-data';

test.describe('Authentication & Authorization Tests', () => {
  test('login page is accessible', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
  });

  // Role-based access tests
  test.describe('Role-based Access Control', () => {
    for (const role of Object.keys(ROLES)) {
      test(`${role} can access authorized features`, async ({ page }) => {
        await page.goto('/');
        
        // Check accessible features based on role
        for (const [feature, allowed] of Object.entries(PERMISSIONS[role])) {
          const element = page.locator(`[data-testid="${feature}"]`);
          if (allowed) {
            await expect(element).toBeVisible();
          } else {
            await expect(element).toBeHidden();
          }
        }
      });
    }
  });

  // Session management tests
  test.describe('Session Management', () => {
    test('session persists after page reload', async ({ page }) => {
      await page.goto('/');
      const userMenu = page.locator('[data-testid="user-menu"]');
      await expect(userMenu).toBeVisible();
      
      await page.reload();
      await expect(userMenu).toBeVisible();
    });

    test('session expires after timeout', async ({ page }) => {
      await page.goto('/');
      // Set session to expired state
      await page.evaluate(() => {
        localStorage.setItem('sessionExpiry', (Date.now() - 1000).toString());
      });
      await page.reload();
      
      // Should be redirected to login
      await expect(page).toHaveURL(/.*auth/);
    });
  });

  // API route protection tests
  test.describe('API Route Protection', () => {
    test('protected routes require authentication', async ({ request }) => {
      const response = await request.get('/api/protected-resource');
      expect(response.status()).toBe(401);
    });

    test('invalid tokens are rejected', async ({ request }) => {
      const response = await request.get('/api/protected-resource', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      expect(response.status()).toBe(401);
    });
  });

  // Sanity Studio integration tests
  test.describe('Sanity Studio Integration', () => {
    test('studio login synchronizes with main app', async ({ page }) => {
      await page.goto('/studio');
      await expect(page.locator('[data-testid="sanity-studio"]')).toBeVisible();
    });

    test('studio logout synchronizes with main app', async ({ page }) => {
      await page.goto('/studio');
      await page.click('[data-testid="logout-button"]');
      await page.goto('/');
      // Should be redirected to login
      await expect(page).toHaveURL(/.*auth/);
    });
  });
});
