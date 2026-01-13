/** biome-ignore-all lint/suspicious/noConsole: false positive */

const { execSync } = require('node:child_process');

module.exports = async () => {
/** @type {() => Promise<void>} */
const runLintAndTypeCheck = async () => {
  try {
    console.log('Running lint and type-check before unit tests...');
    // Run lint and type checking; these commands should exist in the workspace scripts.
    // Adjust commands if your monorepo uses different script names or package manager.
    execSync('pnpm lint', { stdio: 'inherit' });
    execSync('pnpm check-types', { stdio: 'inherit' });
  } catch (err) {
    console.error('Pre-test lint/typecheck failed.');
    throw err;
  }
};

module.exports = runLintAndTypeCheck;
}
