// playwright.config.ts for Sanity Studio ad hoc tests
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: ['list', ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.SANITY_STUDIO_URL || 'http://localhost:3333',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'authenticated',
      testMatch: /.*\.auth\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        storageState: 'playwright/.auth/admin.json',
      },
    },
    {
      name: 'editor',
      testMatch: /.*\.editor\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        storageState: 'playwright/.auth/editor.json',
      },
    },
    {
      name: 'contributor',
      testMatch: /.*\.contributor\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        storageState: 'playwright/.auth/contributor.json',
      },
    },
    {
      name: 'anonymous',
      testMatch: /.*\.anon\.spec\.ts/,
    },
  ],
});
