const { execSync } = require('node:child_process');

module.exports = async () => {
  // Run lint and type checking; these commands should exist in the workspace scripts.
  // Adjust commands if your monorepo uses different script names or package manager.
  execSync('pnpm lint', { stdio: 'inherit' });
  execSync('pnpm check-types', { stdio: 'inherit' });
};
