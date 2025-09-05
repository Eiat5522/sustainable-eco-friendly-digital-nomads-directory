import { test, expect } from '@playwright/test';

// Basic RBAC smoke test: unauthenticated users are redirected to login when visiting /admin
// If your app exposes a different admin path, adjust the route below.

test('unauthenticated request to /admin should redirect to login', async ({ page }) => {
  const base = (test.info().project.use.baseURL ?? 'http://localhost:3000').replace(/\/$/, '');
  await page.goto(`${base}/admin`, { waitUntil: 'domcontentloaded' });

  // Either the app redirects to login, or shows a 401/403 page. Check for login path match.
  await expect(page).toHaveURL(/\/login|\/api\/auth\/signin/);
});
