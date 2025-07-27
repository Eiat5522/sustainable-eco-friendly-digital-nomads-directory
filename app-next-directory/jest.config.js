// Jest config for TypeScript + ESM + alias support
/** @type {import('jest').Config} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  // Treat TS/JS files as ESM for SWC/Jest
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],
  setupFiles: ['<rootDir>/jest/setEnvVars.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"]
  },
  transform: {
    '^.+\.(t|j)sx?$': ['@swc/jest', { 
      jsc: { 
        transform: { 
          react: { 
            runtime: 'automatic' 
          } 
        } 
      } 
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/app/api/listings/route$': '<rootDir>/__mocks__/app/api/listings/route.js',
    '^next-auth$': '<rootDir>/__mocks__/next-auth.js',
    '^next-auth/react$': '<rootDir>/__mocks__/next-auth/react.js',
    '^next-auth/jwt$': '<rootDir>/__mocks__/next-auth/jwt.js',
    '^next-auth/providers/credentials$': '<rootDir>/__mocks__/next-auth/providers/credentials.js',
    '^@/__mocks__/(.*)$': '<rootDir>/__mocks__/$1',
    'node-fetch': '<rootDir>/__mocks__/node-fetch.js',
    'leaflet/dist/leaflet.css$': '<rootDir>/__mocks__/leaflet/dist/leaflet.css.js',
    'leaflet.markercluster/dist/MarkerCluster.css$': '<rootDir>/__mocks__/leaflet.markercluster/dist/MarkerCluster.css.js',
    'leaflet.markercluster/dist/MarkerCluster.Default.css$': '<rootDir>/__mocks__/leaflet.markercluster/dist/MarkerCluster.Default.css.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: '<rootDir>/' })
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(next-auth|@auth|jose)/)',
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