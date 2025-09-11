import { defineConfig, devices } from '@playwright/test';

// NOTE: This config will start the Next dev server before running tests and stop it after.
// If your dev server uses a different port, update 'port' below.
const resolvedBaseURL = process.env.BASE_URL ?? 'http://localhost:3000';
const resolvedURL = new URL(resolvedBaseURL);
const isLocal = ['localhost', '127.0.0.1', '0.0.0.0'].includes(resolvedURL.hostname);
const resolvedPort = Number(resolvedURL.port || 3000);

export default defineConfig({
  // Run Playwright tests from the project tests directory, not only e2e,
  // so both .spec.ts and .test.ts files are picked up.
  testDir: './tests',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  timeout: 60_000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }], ['json', { outputFile: 'test-results/test-results.json' }]],
  use: {
    baseURL: resolvedBaseURL,
    headless: true,
    actionTimeout: 15_000,
    ignoreHTTPSErrors: !!process.env.ALLOW_INSECURE_HTTPS,
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } }
    }
  ],
  webServer: isLocal
    ? {
        command: `pnpm run dev`,
        cwd: '.',
        url: resolvedBaseURL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        env: {
          PORT: String(resolvedPort),
          // Keep Next in dev mode; use explicit toggles for test behavior.
          // NODE_ENV: 'development', // optional: or omit entirely and let Next set it
          E2E: '1',
          NEXT_TELEMETRY_DISABLED: '1'
        }
      }
    : undefined,
});
