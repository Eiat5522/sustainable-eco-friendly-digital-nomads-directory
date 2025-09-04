// Playwright runtime settings for jest-playwright
module.exports = {
  browsers: ['chromium'],
  launch: { headless: true },
  contextOptions: {},
  serverOptions: {
    // Use Next.js dev server to avoid build/type presteps during tests
    command: 'pnpm run dev',
    port: 3000,
    launchTimeout: 120000,
    debug: false,
    usedPortAction: 'ignore'
  }
};
