import percySnapshot from '@percy/playwright';
import { test } from '@playwright/test';

test('homepage visual snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await percySnapshot(page, 'homepage');
});
