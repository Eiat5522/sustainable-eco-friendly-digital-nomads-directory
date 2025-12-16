const { execSync } = require('node:child_process');

const { CI, SKIP_PLAYWRIGHT_INSTALL, NODE_ENV } = process.env;

// Helper to check if environment variable is truthy
const isEnvTrue = value => value === '1' || value === 'true';

// Import structuredLogger for logging
let structuredLogger;
try {
  structuredLogger = require('../src/lib/logger').structuredLogger;
} catch (_error) {
  // Fallback to simple stdout/stderr for standalone usage (avoid console.*)
  structuredLogger = {
    info: (...args) => process.stdout.write(args.map(String).join(' ') + '\n'),
    warn: (...args) => process.stderr.write(args.map(String).join(' ') + '\n'),
  };
}

// Skip installation in CI (handled separately with caching) or if explicitly disabled
const shouldSkip = isEnvTrue(SKIP_PLAYWRIGHT_INSTALL) || isEnvTrue(CI) || NODE_ENV === 'production';

if (shouldSkip) {
  structuredLogger.info('[postinstall-playwright] Skipping browser installation (CI or disabled)');
  process.exit(0);
}

// Detect package manager from npm_config_user_agent for consistent usage throughout
const { npm_config_user_agent: UA } = process.env;
const runner = UA?.includes('pnpm') ? 'pnpm exec' : UA?.includes('yarn') ? 'yarn exec' : 'npx';

// Check if browsers are already installed using Playwright CLI
let browsersInstalled = false;
try {
  // Use playwright CLI to list browser files and verify chromium availability
  const checkCmd = `${runner} playwright list-files chromium`;
  execSync(checkCmd, {
    stdio: 'pipe',
    timeout: 5000,
  });
  browsersInstalled = true;
} catch (_err) {
  // Browsers not installed or check failed
  browsersInstalled = false;
}

// Determine if we should attempt installation
const shouldInstall = !browsersInstalled || process.env.FORCE_PLAYWRIGHT_INSTALL === '1';

if (!shouldInstall) {
  structuredLogger.info(
    '[postinstall-playwright] Browsers appear to be cached, skipping installation'
  );
  structuredLogger.info(
    '[postinstall-playwright] Run with FORCE_PLAYWRIGHT_INSTALL=1 to force reinstall'
  );
  process.exit(0);
}

structuredLogger.info('[postinstall-playwright] Installing Playwright browsers...');

try {
  // Install browsers without --with-deps to avoid system dependency issues during postinstall
  // Note: CI workflows use --with-deps separately with better error handling and caching
  const installCmd = `${runner} playwright install chromium`;
  execSync(installCmd, {
    stdio: 'inherit',
    timeout: 300000, // 5 minute timeout
  });
  structuredLogger.info('[postinstall-playwright] Browser installation complete');
} catch (err) {
  // Get workspace name dynamically from package.json for better portability
  const packageJson = require('../package.json');
  const workspaceName = packageJson.name || 'app-next-directory';

  // For user feedback in postinstall, write to stderr for visibility
  process.stderr.write('\n');
  process.stderr.write('⚠️  [postinstall-playwright] Browser installation failed (non-fatal)\n');
  process.stderr.write(
    '   This is a known issue with Playwright installation progress reporting.\n'
  );
  process.stderr.write('\n');
  process.stderr.write('   To install browsers manually, run:\n');
  if (runner.includes('pnpm')) {
    process.stderr.write(`   pnpm --filter ${workspaceName} exec playwright install chromium\n`);
    process.stderr.write('   OR with system dependencies:\n');
    process.stderr.write(`   pnpm --filter ${workspaceName} exec playwright install --with-deps\n`);
  } else if (runner.includes('yarn')) {
    process.stderr.write(`   yarn workspace ${workspaceName} exec playwright install chromium\n`);
    process.stderr.write('   OR with system dependencies:\n');
    process.stderr.write(
      `   yarn workspace ${workspaceName} exec playwright install --with-deps\n`
    );
  } else {
    process.stderr.write('   npx playwright install chromium\n');
    process.stderr.write('   OR with system dependencies:\n');
    process.stderr.write('   npx playwright install --with-deps\n');
  }
  process.stderr.write('\n');
  process.stderr.write('   Error details: ' + (err?.message || err) + '\n');
  process.stderr.write('\n');

  // Log the error with structuredLogger as well
  structuredLogger.warn('Browser installation failed (non-fatal)', err, {
    workspaceName,
    runner,
  });

  // Don't fail the install - this is non-fatal
  process.exit(0);
}
