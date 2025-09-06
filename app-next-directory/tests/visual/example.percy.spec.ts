import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test('homepage visual snapshot', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await percySnapshot(page, 'homepage');
});
