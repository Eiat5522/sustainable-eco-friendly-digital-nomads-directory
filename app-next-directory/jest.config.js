// Jest config for TypeScript + ESM + alias support
/** @type {import('jest').Config} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.js'],
  setupFiles: ['<rootDir>/jest/setEnvVars.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"]
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
        moduleType: 'es6',
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: '<rootDir>/' })
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(bson|@panva\\+hkdf|mongoose|next-auth|mongodb|uuid|.*esm-browser.*)@)',
    'node_modules/(?!.pnpm|bson|@panva/hkdf|mongoose|next-auth|mongodb|uuid|.*esm-browser.*)'
  ],
  testPathIgnorePatterns: [
    '/playwright/',
    '\\.playwright\\.test\\.[jt]s$',
    '\\.pw\\.test\\.[jt]s$',
    'D:/Eiat_Folder/MyProjects/MyOtherProjects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/tests/', // Exclude all Playwright and E2E tests
    '/__tests__/__mocks__/',
    '\\.(d\\.ts)$',
  ]
};
// ...existing code...
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.js'],
// ...existing code...
        moduleType: 'es6',
// ...existing code...
