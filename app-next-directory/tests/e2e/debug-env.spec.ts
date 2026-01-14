// app-next-directory/tests/e2e/debug-env.spec.ts
import { test, expect } from '@playwright/test';

test.only('Debug: Check environment variables exposed to Next.js server', async ({ page }) => {
  await page.goto('/api/debug-env');
  const envVars = await page.evaluate(() => document.body.textContent);
  console.log('--- Debug Environment Variables ---');
  console.log(envVars);
  console.log('-----------------------------------');
  const parsedEnv = JSON.parse(envVars || '{}');

  expect(parsedEnv.NEXTAUTH_SECRET).toEqual('e2e-test-secret-for-testing-only-not-production');
  expect(parsedEnv.NEXT_PUBLIC_SANITY_PROJECT_ID).toEqual('test-project-id');
  expect(parsedEnv.NEXT_PUBLIC_SANITY_DATASET).toEqual('test');
  expect(parsedEnv.SANITY_API_TOKEN).toEqual('e2e-sanity-api-token-for-testing-only');
});