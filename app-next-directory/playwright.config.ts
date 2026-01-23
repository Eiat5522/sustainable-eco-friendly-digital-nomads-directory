/// <reference types="node" />

import { defineConfig, devices } from '@playwright/test';
import { PLAYWRIGHT_BASE_URL, PLAYWRIGHT_SERVER_WAIT_URL } from './tests/config/environment';

// NOTE: This config will start the Next dev server before running tests and stop it after.
// If your dev server uses a different port, update `PLAYWRIGHT_BASE_URL` via env vars.
const resolvedBaseURL = PLAYWRIGHT_BASE_URL;
const resolvedServerWaitURL = PLAYWRIGHT_SERVER_WAIT_URL.toString();

export default defineConfig({
  // Run Playwright tests from the project tests directory using .spec.ts extension only
  // Only run tests inside the `tests/e2e` directory. Integration tests are managed by Jest.
  // This keeps Playwright focused on UI E2E only and prevents it from picking up other
  // spec files that belong to different test runners.
  testDir: './tests',
  // Explicitly match only .spec.ts files within the e2e subdirectory
  testMatch: '**/e2e/**/*.spec.ts',
  // Ignore integration and unit-specs so Playwright does not pick them up when
  // searching for `*.spec.ts` under `tests/`.
  testIgnore: [
    // ensure any explicit integration or jest-style tests that might be present are ignored
    '**/*.integration.*',
    '**/*.unit.*',
    // ignore legacy jest e2e runner files
    '**/jest.*.spec.ts',
    // Explicitly ignore all spec files NOT in the e2e directory
    '**/tests/*.spec.ts',
    '**/tests/debug/**',
    '**/tests/performance/**',
    '**/tests/visual/**',
  ],
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tmp/playwright-report' }],
    // Write JSON and last-run files to tmp/test-results to avoid permission issues
    ['json', { outputFile: 'tmp/test-results/test-results.json' }],
  ],
  webServer: {
    command: 'cross-env E2E=1 NEXT_PUBLIC_E2E=1 pnpm dev',
    url: resolvedServerWaitURL,
    reuseExistingServer: false, // Always start fresh with E2E env vars
    timeout: 120_000,
    env: {
      ...process.env,
      E2E: '1',
      NEXT_PUBLIC_E2E: '1',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? resolvedBaseURL,
      NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL ?? resolvedBaseURL,
    },
  },
  use: {
    baseURL: resolvedBaseURL,
    headless: true,
    actionTimeout: 15_000,
    ignoreHTTPSErrors: Boolean(process.env.ALLOW_INSECURE_HTTPS),
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    // Setup project to generate storageState files before running tests
    { name: 'setup', testMatch: '**/auth.setup.ts', testIgnore: ['**/jest.setup.ts'] },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
      dependencies: ['setup'],
    },
  ],
});
