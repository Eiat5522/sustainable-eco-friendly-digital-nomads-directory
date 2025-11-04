const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

const { CI, SKIP_PLAYWRIGHT_INSTALL, NODE_ENV } = process.env;

// Skip installation in CI (handled separately with caching) or if explicitly disabled
const shouldSkip = 
  SKIP_PLAYWRIGHT_INSTALL === '1' || 
  SKIP_PLAYWRIGHT_INSTALL === 'true' ||
  (CI === '1' || CI === 'true') ||
  NODE_ENV === 'production';

if (shouldSkip) {
  console.log('[postinstall-playwright] Skipping browser installation (CI or disabled)');
  process.exit(0);
}

// Check if browsers are already installed by looking for the Chromium binary
const playwrightCache = process.env.PLAYWRIGHT_BROWSERS_PATH || 
  path.join(require('os').homedir(), '.cache', 'ms-playwright');

// Check if Chromium executable exists (more robust than just checking cache dir)
const chromiumPath = path.join(playwrightCache, 'chromium-*');
const { execSync: execSyncCheck } = require('child_process');
let browsersInstalled = false;
try {
  // Use playwright CLI to check if browsers are installed
  execSyncCheck('pnpm exec playwright list-files chromium', { 
    stdio: 'pipe',
    timeout: 5000 
  });
  browsersInstalled = true;
} catch (err) {
  // Browsers not installed or check failed
  browsersInstalled = false;
}

// Determine if we should attempt installation
const shouldInstall = !browsersInstalled || process.env.FORCE_PLAYWRIGHT_INSTALL === '1';

if (!shouldInstall) {
  console.log('[postinstall-playwright] Browsers appear to be cached, skipping installation');
  console.log('[postinstall-playwright] Run with FORCE_PLAYWRIGHT_INSTALL=1 to force reinstall');
  process.exit(0);
}

console.log('[postinstall-playwright] Installing Playwright browsers...');

// Detect package manager from npm_config_user_agent or fallback to npx
const { npm_config_user_agent: UA } = process.env;
const runner = UA && UA.includes('pnpm') ? 'pnpm exec'
  : UA && UA.includes('yarn') ? 'yarn exec'
  : 'npx';

try {
  // Use exec without --with-deps to avoid the system dependency installation that causes issues
  // Users can run with --with-deps manually if needed
  const installCmd = `${runner} playwright install chromium`;
  execSync(installCmd, { 
    stdio: 'inherit',
    timeout: 300000 // 5 minute timeout
  });
  console.log('[postinstall-playwright] Browser installation complete');
} catch (err) {
  console.warn('');
  console.warn('⚠️  [postinstall-playwright] Browser installation failed (non-fatal)');
  console.warn('   This is a known issue with Playwright installation progress reporting.');
  console.warn('');
  console.warn('   To install browsers manually, run:');
  if (runner.includes('pnpm')) {
    console.warn('   pnpm --filter app-next-directory exec playwright install chromium');
    console.warn('   OR with system dependencies:');
    console.warn('   pnpm --filter app-next-directory exec playwright install --with-deps');
  } else if (runner.includes('yarn')) {
    console.warn('   yarn workspace app-next-directory exec playwright install chromium');
    console.warn('   OR with system dependencies:');
    console.warn('   yarn workspace app-next-directory exec playwright install --with-deps');
  } else {
    console.warn('   npx playwright install chromium');
    console.warn('   OR with system dependencies:');
    console.warn('   npx playwright install --with-deps');
  }
  console.warn('');
  console.warn('   Error details:', err?.message || err);
  console.warn('');
  // Don't fail the install - this is non-fatal
  process.exit(0);
}
