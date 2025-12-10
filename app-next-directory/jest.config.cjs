/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * jest.config.cjs
 * Jest config for TypeScript + ESM + React 18/19 compatible unit tests
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Optional setup file
  testEnvironment: 'jsdom',
};

// Convert to CommonJS-compatible synchronous config so Node can load this file
const path = require('node:path');
const fs = require('node:fs');

// Attempt to load pathsToModuleNameMapper from ts-jest if available. If not,
// fall back to a no-op mapper so the rest of the config still works.
let pathsToModuleNameMapper = () => ({});
try {
  // ts-jest may export this helper in CommonJS builds
  const tsJest = require('ts-jest');
  if (tsJest && typeof tsJest.pathsToModuleNameMapper === 'function') {
    pathsToModuleNameMapper = tsJest.pathsToModuleNameMapper;
  }
} catch (_e) {
  // ignore - we'll fallback to an empty mapper
}

// Read tsconfig.json synchronously using __dirname so this file remains CJS.
let compilerOptions = {};
try {
  const tsconfigRaw = fs.readFileSync(path.resolve(__dirname, './tsconfig.json'), 'utf8');
  compilerOptions = JSON.parse(tsconfigRaw || '{}').compilerOptions || {};
} catch (_e) {
  // ignore - leave compilerOptions empty
}

const useMockedMongoose = process.env.JEST_USE_REAL_MONGOOSE !== '1';

const moduleNameMapper = {
  // Common Next/DOM/library mocks – adjust paths if needed
  '^server-only$': '<rootDir>/__mocks__/server-only.js',
  '^tree-sitter-.*$': '<rootDir>/__mocks__/tree-sitter.js',
  '^next/link$': '<rootDir>/__mocks__/next/link.js',
  '^next/image$': '<rootDir>/__mocks__/next/image.js',
  '^next/font/google$': '<rootDir>/__mocks__/next/font/google.js',
  '^next/headers$': '<rootDir>/__mocks__/next/headers.js',
  '^next/cache$': '<rootDir>/__mocks__/next/cache.js',
  '^@sanity/client$': '<rootDir>/__mocks__/@sanity/client.ts',
  '^next-sanity$': '<rootDir>/__mocks__/next-sanity.js',
  '^@/mocks/server$': '<rootDir>/src/mocks/server.ts',
  '^mocks/server$': '<rootDir>/src/mocks/server.ts',
  '^clsx$': '<rootDir>/__mocks__/clsx.js',
  '^tailwind-merge$': '<rootDir>/__mocks__/tailwind-merge.js',
  '^embla-carousel-react$': '<rootDir>/__mocks__/embla-carousel-react.js',
  '^embla-carousel-autoplay$': '<rootDir>/__mocks__/embla-carousel-autoplay.js',
  '^until-async$': '<rootDir>/__mocks__/until-async.ts',
  '^leaflet$': '<rootDir>/__mocks__/leaflet.ts',
  'leaflet/dist/leaflet.css$': '<rootDir>/__mocks__/leaflet/dist/leaflet.css.js',
  'leaflet.markercluster/dist/MarkerCluster.css$':
    '<rootDir>/__mocks__/leaflet.markercluster/dist/MarkerCluster.css.js',
  'leaflet.markercluster/dist/MarkerCluster.Default.css$':
    '<rootDir>/__mocks__/leaflet.markercluster/dist/MarkerCluster.Default.css.js',
  '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',

  // next-auth & providers mocks (if you still rely on them elsewhere)
  '^next-auth$': '<rootDir>/__mocks__/next-auth.js',
  '^next-auth/react$': '<rootDir>/__mocks__/next-auth/react.js',
  '^next-auth/jwt$': '<rootDir>/__mocks__/next-auth/jwt.js',
  '^next-auth/providers/credentials$': '<rootDir>/__mocks__/next-auth/providers/credentials.js',
  '^next-auth/providers/(.*)$': '<rootDir>/__mocks__/next-auth/providers/$1.js',
  '^@auth/core/providers/(.*)$': '<rootDir>/__mocks__/next-auth/providers/$1.js',
  '^@auth/mongodb-adapter$': '<rootDir>/__mocks__/@auth/mongodb-adapter.js',
  '^@playwright/test$': '<rootDir>/tests/helpers/playwright-jest-stub.ts',

  '^@mocks/server$': '<rootDir>/src/mocks/server.ts',
  '^@mocks/handlers$': '<rootDir>/src/mocks/handlers.ts',
  '^@mocks/(.*)$': '<rootDir>/__mocks__/$1',
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@tests/(.*)$': '<rootDir>/tests/$1',
  '^@/lib/dbConnect(?:\\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/dbConnect.js',
  '^@/models/User$': '<rootDir>/__mocks__/@/models/User.js',
  // '^@/lib/redis(?:\\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/redis.ts', // REMOVED: global Redis mock mapping for best practice
  '^@/lib/rate-limit(?:\\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/rate-limit.js',
  '^@/lib/logger(?:\\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/logger.js',

  // TS path aliases from tsconfig.json (resolved at runtime). If
  // ts-jest isn't available, this will be a no-op.
  ...pathsToModuleNameMapper(compilerOptions?.paths ? compilerOptions.paths : {}, {
    prefix: '<rootDir>/',
  }),
  '^@/utils/api-response$': '<rootDir>/src/mocks/api-response.ts',
};

if (useMockedMongoose) {
  moduleNameMapper['^mongoose$'] = '<rootDir>/__mocks__/mongoose.ts';
  moduleNameMapper['^mongodb$'] = '<rootDir>/__mocks__/mongodb.js';
}

module.exports = {
  // Scope discovery to your source dirs in this package
  roots: ['<rootDir>/src', '<rootDir>/app'],

  // Transform with SWC and emit ESM so top-level await & unstable_mockModule work
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2022',
          transform: { react: { runtime: 'automatic' } },
        },
        module: { type: 'es6' },
      },
    ],
  },

  // Treat these as ESM inside Jest to support ESM-only packages shipped as .js
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],

  testEnvironment: process.env.JEST_RUN_INTEGRATION === '1' ? 'node' : 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },

  setupFiles: ['<rootDir>/jest/setEnvVars.js', '<rootDir>/next.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Optionally start an in-memory MongoDB for integration tests.
  globalSetup: '<rootDir>/jest/globalSetup.cjs',
  globalTeardown: '<rootDir>/jest/globalTeardown.cjs',

  testMatch: [
    '<rootDir>/src/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/*.msw.test.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/__tests__/**/*.msw.test.(ts|tsx|js|jsx)',
    '<rootDir>/app/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/app/**/*.msw.test.(ts|tsx|js|jsx)',
    '<rootDir>/app/**/__tests__/**/*.(ts|tsx|js|jsx)',
  ],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  resolver: '<rootDir>/jest/resolver.cjs',

  moduleNameMapper,

  transformIgnorePatterns: [
    // Allow ESM libs through transform, using a pnpm-compatible regex
    '/node_modules/(?!.*(?:next-auth|@auth|jose|broadcast-channel|msw|@mswjs|until-async|strict-event-emitter|@open-draft|mongodb|mongoose))',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    'app/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/__mocks__/**/*',
    '!**/*.test.*',
    '!**/node_modules/**',
    '!**/*.config.*',
    '!**/middleware.*',
  ],

  watchPathIgnorePatterns: ['^<rootDir>/tests/', '[\\/](playwright)[\\/]'],

  // By default, ignore integration tests (files ending with .int.test.* or .integration.test.*)
  // unless the test runner explicitly sets JEST_RUN_INTEGRATION=1. This avoids
  // accidentally picking up long-running DB integration tests during unit runs.
  testPathIgnorePatterns: [
    '^<rootDir>/tests/',
    '[\\/](playwright)[\\/]',
    '[\\/]__tests__[\\/]__mocks__[\\/]',
    '\\.d(\\.test)?\\.ts$',
    'reporter\\.js$',
  ].concat(
    // If JEST_UNIT_ONLY=1 we also ignore integration tests. Integration tests
    // will only be run when JEST_RUN_INTEGRATION=1 is set (e.g., in test:integration).
    process.env.JEST_UNIT_ONLY === '1' || process.env.JEST_RUN_INTEGRATION !== '1'
      ? ['\\.(int|integration)\\.test\\.(ts|tsx|js|jsx)$']
      : []
  ),
};
