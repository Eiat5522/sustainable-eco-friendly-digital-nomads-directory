port { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list'], ['json', { outputFile: 'test-results/test-results.json' }]],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    // Enable JavaScript in the browser for map functionality
    javaScriptEnabled: true,
    // Enable screenshot on failure
    screenshot: 'only-on-failure',
    // Enable video recording on failure
    video: 'retain-on-failure',
  },
  projects: [
    // Setup project
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // Unit and Component Testing
    {
      name: 'unit',
      testDir: './tests/unit',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    // API Testing
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          Accept: 'application/json',
        },
      },
      dependencies: ['setup'],
    },

    // UX/UI Testing
    {
      name: 'ux-chrome',
      testDir: './tests/ux',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'ux-firefox',
      testDir: './tests/ux',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'ux-safari',
      testDir: './tests/ux',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    {
      name: 'ux-mobile-chrome',
      testDir: './tests/ux',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    {
      name: 'ux-mobile-safari',
      testDir: './tests/ux',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },

    // E2E Testing
    {
      name: 'e2e-chrome',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'e2e-firefox',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },

    // Authenticated test projects
    {
      name: 'logged-in-chrome',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'admin-chrome',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes
    stderr: 'pipe',
    stdout: 'pipe',
  },
  // Global timeout for all tests
  timeout: 30000,
  // Global expect timeout
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
  },
});
