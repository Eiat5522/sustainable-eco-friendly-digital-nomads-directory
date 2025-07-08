// Jest config for TypeScript + ESM + alias support
/** @type {import('jest').Config} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  setupFiles: ['<rootDir>/jest/setEnvVars.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: '<rootDir>/' })
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/.pnpm/(?!(bson|@panva\+hkdf|mongoose|next-auth|mongodb|uuid|.*esm-browser.*)@)',
    'node_modules/(?!.pnpm|bson|@panva/hkdf|mongoose|next-auth|mongodb|uuid|.*esm-browser.*)'
  ],
  // Removed deprecated 'globals.ts-jest' config
  testPathIgnorePatterns: [
    '/playwright/',
    '\\.playwright\\.test\\.[jt]s$',
    '\\.pw\\.test\\.[jt]s$',
    'D:/Eiat_Folder/MyProjects/MyOtherProjects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/tests/', // Exclude all Playwright and E2E tests
    // Exclude mock definition files and declaration files from test suites
    '/__tests__/__mocks__/',
    '\\.(d\\.ts)$',
  ]
};
