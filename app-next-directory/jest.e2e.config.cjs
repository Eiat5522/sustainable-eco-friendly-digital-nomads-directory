// Minimal Jest E2E config for running Playwright-powered suites under Jest (legacy).
// Recommended: use Playwright Test runner (see `pnpm test:e2e`).

/** @type {import('jest').Config} */
const path = require('path');
const fs = require('fs');
let base = {};
const basePath = path.resolve(__dirname, './jest.config.cjs');
if (fs.existsSync(basePath)) {
  // Will throw if the base config itself has a runtime/parse error (desired).
  base = require(basePath);
}
const baseModuleNameMapper = (base && typeof base === 'object' && base.moduleNameMapper)
  ? base.moduleNameMapper
  : {};
const baseTransformIgnorePatterns = (base && typeof base === 'object' && base.transformIgnorePatterns)
  ? base.transformIgnorePatterns
  : ['/node_modules/'];
try {
  const shouldLog = process.env.JEST_CONFIG_DEBUG === '1' || process.env.DEBUG_JEST_CONFIG === '1' || true;
  if (shouldLog) {
    const lim = (v) => JSON.stringify(v, null, 2);
    console.log('[jest-e2e-config] Using base from:', basePath);
    console.log('[jest-e2e-config] moduleNameMapper =', lim(baseModuleNameMapper));
    console.log('[jest-e2e-config] transformIgnorePatterns =', lim(baseTransformIgnorePatterns));
  }
} catch {}

module.exports = {
  preset: 'jest-playwright-preset',
  testEnvironment: 'jest-playwright-preset',
  // Restrict legacy Jest-driven suites to the legacy folder so Playwright e2e
  // suites are always executed by the Playwright test runner.
  testMatch: [
    '<rootDir>/tests/legacy/**/*.test.ts',
    '<rootDir>/tests/api/**/*-api.test.ts',
  ],
  setupFiles: ['<rootDir>/jest/setEnvVars.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      jsc: { transform: { react: { runtime: 'automatic' } } },
      module: { type: 'commonjs' }
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  moduleNameMapper: Object.assign({}, baseModuleNameMapper),
  transformIgnorePatterns: baseTransformIgnorePatterns,
  testPathIgnorePatterns: [
    '[\\\\/]src[\\\\/]',
    '[\\\\/]app[\\\\/]',
    '[\\\\/]__tests__[\\\\/]',
    '<rootDir>/tests/e2e/',
    // Quarantined legacy/flaky e2e/api tests
    '<rootDir>/tests/api/preview-api.test.ts',
    '<rootDir>/tests/api/events-api.test.ts'
  ],
  testTimeout: 60000,
};
