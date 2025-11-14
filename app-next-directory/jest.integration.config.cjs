const baseConfig = require('./jest.config.cjs');

const unique = (items) => Array.from(new Set(items.filter(Boolean)));

const integrationTestPatterns = [
  '<rootDir>/src/**/*.integration.test.(ts|js)',
  '<rootDir>/src/**/*.int.test.(ts|js)',
];

module.exports = {
  ...baseConfig,
  displayName: baseConfig.displayName
    ? `${baseConfig.displayName} (integration)`
    : 'integration',
  testEnvironment: 'node',
  setupFilesAfterEnv: unique([
    ...(baseConfig.setupFilesAfterEnv ?? []),
    '<rootDir>/jest/integration.setup.ts',
  ]),
  testMatch: integrationTestPatterns,
  testPathIgnorePatterns: (baseConfig.testPathIgnorePatterns ?? []).filter(
    (pattern) => !pattern.includes('(int|integration)')
  ),
};
