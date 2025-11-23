import { test } from '@playwright/test';
import { loginAndSave } from './helpers/login';

/**
 * Generate storageState JSON files for test roles.
 * Run with: npx playwright test app-next-directory/tests/generate-storage-states.spec.ts --project=chromium
 * Make sure the app is running and TEST_API_ENABLED (if used) is set appropriately.
 */

test('generate storage states for roles', async ({ page }) => {
  // Customer
  await loginAndSave(
    page,
    { email: 'test_customer@example.com', password: 'password' },
    'app-next-directory/tests/storageStates/customer.json'
  );

  // Owner
  await loginAndSave(
    page,
    { email: 'test_owner@example.com', password: 'password' },
    'app-next-directory/tests/storageStates/owner.json'
  );
});
