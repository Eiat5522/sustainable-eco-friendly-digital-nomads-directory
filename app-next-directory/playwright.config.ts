/// <reference types="node" />

import { defineConfig, devices } from '@playwright/test'

// NOTE: This config will start the Next dev server before running tests and stop it after.
// If your dev server uses a different port, update `BASE_URL`/`PORT` below.
const resolvedBaseURL = process.env.BASE_URL ?? 'http://localhost:3000'
const resolvedURL = new URL(resolvedBaseURL)
const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1'])
const isLocal = localHosts.has(resolvedURL.hostname)
const resolvedPort = Number(resolvedURL.port || 3000)

// Include IPv6 loopback and normalize wait host
const serverWaitURL = new URL(resolvedBaseURL)
if (serverWaitURL.hostname === '0.0.0.0' || serverWaitURL.hostname === '::1') {
  serverWaitURL.hostname = '127.0.0.1'
}

export default defineConfig({
  // Run Playwright tests from the project tests directory so both .spec.ts and .test.ts files are picked up.
  testDir: './tests',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  testIgnore: [
    'tests/api/*-api.test.ts',
    'tests/api/events-api.test.ts',
    'tests/api/preview-api.test.ts',
    'tests/e2e/**/*.e2e.*',
    'tests/CityCarousel.test.tsx',
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
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
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
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: isLocal
    ? {
        command: 'npm run dev',
        url: serverWaitURL.toString(),
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
        env: {
          PORT: String(resolvedPort),
          // Keep Next in dev mode; use explicit toggles for test behavior.
          E2E: '1',
          NEXT_PUBLIC_E2E: '1',
          NEXT_PUBLIC_SANITY_PROJECT_ID:
            process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'test-project',
          NEXT_PUBLIC_SANITY_DATASET:
            process.env.NEXT_PUBLIC_SANITY_DATASET || 'test-dataset',
          NEXT_TELEMETRY_DISABLED: '1',
        },
      }
    : undefined,
})
