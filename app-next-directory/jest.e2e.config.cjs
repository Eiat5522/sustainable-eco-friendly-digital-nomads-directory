// Jest config for E2E/browser + API integration tests under Jest via Playwright
/** @type {import('jest').Config} */
const base = require('./jest.config.cjs');

module.exports = {
  preset: 'jest-playwright-preset',
  testEnvironment: 'jest-playwright-preset',
  testMatch: [
    '<rootDir>/tests/e2e/**/*.e2e.test.ts',
    '<rootDir>/tests/api/auth-api.test.ts',
    '<rootDir>/tests/api/preview-api.test.ts'
  ],
  setupFiles: ['<rootDir>/jest/setEnvVars.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      jsc: { transform: { react: { runtime: 'automatic' } } },
      module: { type: 'es6' }
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  moduleNameMapper: base.moduleNameMapper,
  transformIgnorePatterns: base.transformIgnorePatterns,
  // Keep scope tight to E2E/API suites
  testPathIgnorePatterns: [
    '[\\\\/]src[\\\\/]',
    '[\\\\/]app[\\\\/]',
    '[\\\\/]__tests__[\\\\/]'
  ],
  testTimeout: 60000,
};
