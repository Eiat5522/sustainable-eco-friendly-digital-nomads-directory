const { existsSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const { CI, NODE_ENV, npm_config_user_agent: UA } = process.env;
const workerPath = path.resolve(__dirname, '../public/mockServiceWorker.js');
const hasWorker = existsSync(workerPath);
const isCi = ['1', 'true', 'yes'].includes(String(CI || '').toLowerCase());
const env = NODE_ENV || 'development';
const hasPublicDir = existsSync(path.resolve(__dirname, '../public'));
const shouldInit = hasPublicDir && !hasWorker && !isCi && env !== 'production';

if (shouldInit) {
  const runner = UA && UA.includes('pnpm') ? 'pnpm dlx'
    : UA && UA.includes('yarn') ? 'yarn dlx'
    : 'npx -y';
  const cmd = `${runner} msw init public --save`;
  try {
    console.log(`[postinstall-msw] Initializing MSW: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.warn('[postinstall-msw] Skipped MSW init:', err?.message || err);
  }
}