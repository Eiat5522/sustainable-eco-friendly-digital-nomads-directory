import { expect, test } from '@playwright/test';
import { structuredLogger } from '@/lib/logger';

test('Debug: Check environment variables exposed to Next.js server', async ({ page }) => {
  await page.goto('/api/debug-env');
  const envVars = await page.evaluate(() => document.body.textContent);

test('Debug: Check environment variables exposed to Next.js server', async ({ page }) => {
  structuredLogger.log('--- Debug Environment Variables ---');
  structuredLogger.log(envVars);
  structuredLogger.log('-----------------------------------');
    const parsedEnv = JSON.parse(envVars || '{}');

    expect(parsedEnv.NEXTAUTH_SECRET).toEqual('e2e-test-secret-for-testing-only-not-production');
    expect(parsedEnv.NEXT_PUBLIC_SANITY_PROJECT_ID).toEqual('test-project-id');
    expect(parsedEnv.NEXT_PUBLIC_SANITY_DATASET).toEqual('test');
    expect(parsedEnv.SANITY_API_TOKEN).toEqual('e2e-sanity-api-token-for-testing-only');
  });
});
    expect(parsedEnv.NEXT_PUBLIC_SANITY_DATASET).toEqual('test');
    expect(parsedEnv.SANITY_API_TOKEN).toEqual('e2e-sanity-api-token-for-testing-only');
  });
});
