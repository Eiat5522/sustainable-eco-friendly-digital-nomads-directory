import { defineConfig, devices } from '@playwright/test';

// Example BrowserStack Playwright configuration using WebSocket endpoint
// Fill BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY in env

const bsUser = process.env.BROWSERSTACK_USERNAME;
const bsKey = process.env.BROWSERSTACK_ACCESS_KEY;

if (!bsUser || !bsKey) {
  throw new Error(
    'BrowserStack credentials are required. Please set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables.'
  );
}

const wsEndpoint = `wss://cdp.browserstack.com/playwright?caps=browserstack.username=${bsUser}&browserstack.accessKey=${bsKey}`;if (!bsUser || !bsKey) {
  throw new Error(
    'BrowserStack credentials are required. Please set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables.'
  );
}

const wsEndpoint = `wss://cdp.browserstack.com/playwright?caps=browserstack.username=${encodeURIComponent(bsUser)}&browserstack.accessKey=${encodeURIComponent(bsKey)}`;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    actionTimeout: 0,
    navigationTimeout: 30_000,
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    // Connect through BrowserStack Playwright WebSocket
    connectOptions: {
      wsEndpoint,
    },
  },
  projects: [
    {
      name: 'bs-chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Example BrowserStack caps (add more caps via env var or modify here)
        browserName: 'chromium',
      },
    },
  ],
});
