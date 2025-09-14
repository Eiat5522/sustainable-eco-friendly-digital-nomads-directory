// Playwright runtime settings for jest-playwright
module.exports = {
  testTimeout: 180000, // Align with launchTimeout and wait time
  browsers: ['chromium'],
  launchOptions: { headless: process.env.CI ? true : process.env.HEADLESS !== '0' },
  serverOptions: {
    // Use Next.js dev server to avoid build/type presteps during tests
    command: 'pnpm run dev',
    cwd: './', // Point to app directory for correct workspace
    port: 3000,
    launchTimeout: 180000, // Increased timeout for slow startup
    debug: !!process.env.JPW_DEBUG, // Conditional debug to silence CI noise
    usedPortAction: 'error', // Fail if port is already in use
    waitOnScheme: {
      resources: ['http-get://localhost:3000'], // Use HTTP GET for readiness check
      timeout: 180000 // Wait up to 3 minutes for server to be ready
    }
  }
};

// NOTE: Playwright requires Node.js 14+ due to optional chaining syntax. Ensure Node.js is updated if errors persist.
