const { existsSync } = require('node:fs');
const { execSync } = require('node:child_process');
const path = require('node:path');

const { CI, NODE_ENV, npm_config_user_agent: UA } = process.env;
const workerPath = path.resolve(__dirname, '../public/mockServiceWorker.js');
const hasWorker = existsSync(workerPath);
const isCi = ['1', 'true', 'yes'].includes(String(CI || '').toLowerCase());
const env = NODE_ENV || 'development';
const hasPublicDir = existsSync(path.resolve(__dirname, '../public'));
const shouldInit = hasPublicDir && !hasWorker && !isCi && env !== 'production';

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

if (shouldInit) {
  const runner = UA?.includes('pnpm') ? 'pnpm dlx' : UA?.includes('yarn') ? 'yarn dlx' : 'npx -y';
  const cmd = `${runner} msw init public --save`;
  try {
    structuredLogger.info(`[postinstall-msw] Initializing MSW: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    structuredLogger.warn('[postinstall-msw] Skipped MSW init:', err?.message || err);
  }
}
