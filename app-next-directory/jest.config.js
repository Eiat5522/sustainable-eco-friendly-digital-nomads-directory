// Jest configuration for app-next-directory
// This config ensures tests load tests/jest.setup.ts and run a global setup
// that performs linting and type checking before the test suite runs.

module.exports = {
  rootDir: __dirname,
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  globalSetup: '<rootDir>/tests/jest.global-setup.js',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    // map next/image and next/link if needed by jest transforms; adjust if your monorepo shares configs
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};
