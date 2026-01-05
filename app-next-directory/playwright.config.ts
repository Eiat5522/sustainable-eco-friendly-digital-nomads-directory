/// <reference types="node" />

import { defineConfig, devices } from '@playwright/test';
import {
  PLAYWRIGHT_BASE_URL,
  PLAYWRIGHT_ENV,
  PLAYWRIGHT_IS_LOCAL,
  PLAYWRIGHT_PORT,
} from './tests/config/environment';

// NOTE: This config will start the Next dev server before running tests and stop it after.
// If your dev server uses a different port, update `PLAYWRIGHT_BASE_URL` via env vars.
const resolvedBaseURL = PLAYWRIGHT_BASE_URL;
const isLocal = PLAYWRIGHT_IS_LOCAL;
const resolvedPort = PLAYWRIGHT_PORT;
const serverWaitURL = PLAYWRIGHT_ENV.serverWaitURL;

export default defineConfig({
  // Global setup will generate storageState JSON files for fast auth reuse
  // Use ESM-safe string path (avoid require in ESM config)
  globalSetup: './tests/global-setup',
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
  use: {
    baseURL: resolvedBaseURL,
    headless: true,
    actionTimeout: 15_000,
    ignoreHTTPSErrors: Boolean(process.env.ALLOW_INSECURE_HTTPS),
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    // Setup project
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, storageState: 'playwright/.auth/user.json', }, dependencies: ['setup'], },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 1280, height: 800 }, storageState: 'playwright/.auth/user.json', }, dependencies: ['setup'], },
     ],  webServer: isLocal
      ? {
        command: 'next dev',        url: serverWaitURL.toString(),
        // Increase timeout for containerized environments (build + startup can take longer)
        timeout: 180_000,
        // In CI/E2E/Docker runs we should NOT reuse an existing server to avoid stale processes
        reuseExistingServer: !(process.env.CI || process.env.E2E || process.env.NEXT_PUBLIC_E2E),
        env: {
          // Load .env.e2e file for isolated test environment
          NODE_ENV: 'development',
          PORT: String(resolvedPort),
          E2E: '1',
          NEXT_PUBLIC_E2E: '1',
          ENABLE_TEST_PAGES: 'true',
          USE_REAL_MONGODB_FOR_E2E: '1',
          // Use isolated test credentials
          NEXT_PUBLIC_SANITY_PROJECT_ID: 'test-project-id',
          NEXT_PUBLIC_SANITY_DATASET: 'test',
          NEXT_TELEMETRY_DISABLED: '1',
          MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/e2e_test',
          NEXTAUTH_SECRET: 'e2e-test-secret-for-testing-only-not-production',
          NEXTAUTH_URL: resolvedBaseURL.toString(),
          NEXT_PUBLIC_FRONTEND_URL: resolvedBaseURL.toString(),
          // Disable external services for E2E
          RESEND_API_TOKEN: '',
          UPSTASH_REDIS_REST_URL: '',
          UPSTASH_REDIS_REST_TOKEN: '',
        },
      }
    : undefined,
});
