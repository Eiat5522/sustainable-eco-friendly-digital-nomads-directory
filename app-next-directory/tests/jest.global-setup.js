/** biome-ignore-all lint/suspicious/noConsole: false positive */

const { execSync } = require('node:child_process');

/** @type {() => Promise<void>} */
const runLintAndTypeCheck = async () => {
  try {
    console.log('Running lint and type-check before unit tests...');
    execSync('pnpm lint', { stdio: 'inherit' });
    execSync('pnpm check-types', { stdio: 'inherit' });
  } catch (err) {
    console.error('Pre-test lint/typecheck failed.');
    throw err;
  }
};
module.exports = runLintAndTypeCheck;
