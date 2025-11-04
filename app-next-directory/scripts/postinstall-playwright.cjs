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

// Determine if we should attempt installation
const shouldInstall = !existsSync(playwrightCache) || process.env.FORCE_PLAYWRIGHT_INSTALL === '1';

if (!shouldInstall) {
  console.log('[postinstall-playwright] Browsers appear to be cached, skipping installation');
  console.log('[postinstall-playwright] Run with FORCE_PLAYWRIGHT_INSTALL=1 to force reinstall');
  process.exit(0);
}

console.log('[postinstall-playwright] Installing Playwright browsers...');

try {
  // Use exec without --with-deps to avoid the system dependency installation that causes issues
  // Users can run `pnpm exec playwright install --with-deps` manually if needed
  execSync('pnpm exec playwright install chromium', { 
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
  console.warn('   pnpm --filter app-next-directory exec playwright install chromium');
  console.warn('   OR with system dependencies:');
  console.warn('   pnpm --filter app-next-directory exec playwright install --with-deps');
  console.warn('');
  console.warn('   Error details:', err?.message || err);
  console.warn('');
  // Don't fail the install - this is non-fatal
  process.exit(0);
}
