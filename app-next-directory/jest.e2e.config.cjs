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
module.exports = {
  preset: 'jest-playwright-preset',
  testEnvironment: 'jest-playwright-preset',
  testMatch: [
    '<rootDir>/tests/e2e/**/*.e2e.test.ts',
    '<rootDir>/tests/api/**/*-api.test.ts'
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
  moduleNameMapper: { ...(base?.moduleNameMapper ?? {}) },
  transformIgnorePatterns: base?.transformIgnorePatterns ?? ['/node_modules/'],
  testPathIgnorePatterns: [
    '[\\\\/]src[\\\\/]',
    '[\\\\/]app[\\\\/]',
    '[\\\\/]__tests__[\\\\/]'
  ],
  testTimeout: 60000,
};
