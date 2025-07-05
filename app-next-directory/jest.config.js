// Jest config for TypeScript + ESM + alias support
/** @type {import('jest').Config} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  setupFiles: ['<rootDir>/jest/setEnvVars.js'],
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs)$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: '<rootDir>/' })
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/.pnpm/(?!(bson|@panva\+hkdf|mongoose|next-auth|mongodb)@)',
    'node_modules/(?!.pnpm|bson|@panva/hkdf|mongoose|next-auth|mongodb)'
  ],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig.json'
    }
  },
  testPathIgnorePatterns: [
    '/playwright/',
    '\\.playwright\\.test\\.[jt]s$',
    '\\.pw\\.test\\.[jt]s$',
    'D:/Eiat_Folder/MyProjects/MyOtherProjects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/tests/', // Exclude all Playwright and E2E tests
  ]
};
