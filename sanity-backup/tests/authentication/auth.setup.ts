import { test as setup, expect } from '@playwright/test';
import { ROLES, USERS } from '../utils/test-data';

// Setup authentication states for different roles
setup('authenticate as different roles', async ({ page }) => {
  // Admin authentication
  await setup.step('Admin Authentication', async () => {
    await page.goto('/auth');
    await page.fill('[data-testid="email-input"]', USERS.admin.email);
    await page.fill('[data-testid="password-input"]', USERS.admin.password);
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await page.context().storageState({ path: 'playwright/.auth/admin.json' });
  });

  // Editor authentication
  await setup.step('Editor Authentication', async () => {
    await page.goto('/auth');
    await page.fill('[data-testid="email-input"]', USERS.editor.email);
    await page.fill('[data-testid="password-input"]', USERS.editor.password);
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await page.context().storageState({ path: 'playwright/.auth/editor.json' });
  });

  // Contributor authentication
  await setup.step('Contributor Authentication', async () => {
    await page.goto('/auth');
    await page.fill('[data-testid="email-input"]', USERS.contributor.email);
    await page.fill('[data-testid="password-input"]', USERS.contributor.password);
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await page.context().storageState({ path: 'playwright/.auth/contributor.json' });
  });
});
