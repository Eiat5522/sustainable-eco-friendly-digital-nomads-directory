// @ts-nocheck
// Jest config for TypeScript + ESM + alias support
/** @type {import('jest').Config} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  // Ensure Jest type globals only apply in tests
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.test.json',
    },
  },
  // Treat TS/JS files as ESM for SWC/Jest
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],
  setupFiles: ['<rootDir>/jest/setEnvVars.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', '<rootDir>/__mocks__/node.ts'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      jsc: { transform: { react: { runtime: 'automatic' } } },
      module: { type: 'es6' }
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  moduleNameMapper: {
    '^server-only$': '<rootDir>/__mocks__/server-only.js',
    '^tree-sitter-.*$': '<rootDir>/__mocks__/tree-sitter.js',
    '^@/app/api/listings/route$': '<rootDir>/__mocks__/app/api/listings/route.js',
    '^next-auth$': '<rootDir>/__mocks__/next-auth.js',
    '^next-auth/react$': '<rootDir>/__mocks__/next-auth/react.js',
    '^next-auth/jwt$': '<rootDir>/__mocks__/next-auth/jwt.js',
    '^next-auth/providers/credentials$': '<rootDir>/__mocks__/next-auth/providers/credentials.js',
    '^next-auth/providers/(.*)$': '<rootDir>/__mocks__/next-auth/providers/$1.js',
    '^@auth/core/providers/(.*)$': '<rootDir>/__mocks__/next-auth/providers/$1.js',
    '^@/__mocks__/(.*)$': '<rootDir>/__mocks__/$1',
    '^@/mocks/server$': '<rootDir>/__mocks__/server.ts',
    '^mocks/server$': '<rootDir>/__mocks__/server.ts',
    '^@sanity/client$': '<rootDir>/__mocks__/@sanity/client.ts',
    '^next-sanity$': '<rootDir>/__mocks__/next-sanity.js',
    '^mongoose$': '<rootDir>/__mocks__/mongoose.ts',
    'node-fetch': '<rootDir>/__mocks__/node-fetch.js',
    '^@/lib/dbConnect$': '<rootDir>/__mocks__/lib/dbConnect.ts',
    '^@/lib/redis$': '<rootDir>/__mocks__/lib/redis.ts',
    '^@/lib/auth/adapter$': '<rootDir>/__mocks__/lib/auth/adapter.ts',
    '^@/lib/auth/config$': '<rootDir>/__mocks__/lib/auth/config.ts',
    '^@/lib/rate-limit$': '<rootDir>/__mocks__/lib/rate-limit.ts',
    '^@/lib/tokens$': '<rootDir>/__mocks__/lib/tokens.ts',
    '^@/lib/email$': '<rootDir>/__mocks__/lib/email.ts',
    '^@/lib/logger$': '<rootDir>/__mocks__/lib/logger.ts',
    '^embla-carousel-react$': '<rootDir>/__mocks__/embla-carousel-react.js',
    '^embla-carousel-autoplay$': '<rootDir>/__mocks__/embla-carousel-autoplay.js',
    'leaflet/dist/leaflet.css$': '<rootDir>/__mocks__/leaflet/dist/leaflet.css.js',
    'leaflet.markercluster/dist/MarkerCluster.css$': '<rootDir>/__mocks__/leaflet.markercluster/dist/MarkerCluster.css.js',
    'leaflet.markercluster/dist/MarkerCluster.Default.css$': '<rootDir>/__mocks__/leaflet.markercluster/dist/MarkerCluster.Default.css.js',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: '<rootDir>/' })
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(next-auth|@auth|jose|broadcast-channel)/)',
  ],
  testPathIgnorePatterns: [
    // Exclude Playwright and other non-unit/integration suites
    '[\\/]tests[\\/]',
    '[\\/]playwright[\\/]',
    '[\\/]__tests__[\\/]__mocks__[\\/]',
    '\\.d(\\\.test)?\\.ts$',
    '[\\/]src[\\/]__tests__[\\/]api[\\/]search[\\/]FORTEST-route\\.copy\\.skip\\.ts$',
    '[\\/]src[\\/]tests[\\/]'
  ].concat(process.env.JEST_UNIT_ONLY === '1' ? [
    '.*\\.(int|integration)\\.test\\.(ts|tsx)$'
  ] : []),
};
