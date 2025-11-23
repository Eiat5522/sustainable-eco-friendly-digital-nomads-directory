const baseConfig = require('./jest.config.cjs');

const unique = items => Array.from(new Set(items.filter(Boolean)));

const reactIntegrationTestPatterns = ['<rootDir>/src/**/*.integration.test.(tsx)'];

module.exports = {
  ...baseConfig,
  displayName: 'react-integration',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: unique([
    ...(baseConfig.setupFilesAfterEnv ?? []),
    '<rootDir>/jest/integration.setup.ts',
  ]),
  testMatch: reactIntegrationTestPatterns,
};
