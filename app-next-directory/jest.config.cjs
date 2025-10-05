// @ts-nocheck
// Jest config for TypeScript + ESM + alias support
/** @type {import('jest').Config} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  // Limit unit-test discovery to application source directories
  roots: ['<rootDir>/src', '<rootDir>/app'],
  // Ensure Jest type globals only apply in tests
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.test.json',
    },
  },
  
  // VS Code Jest extension support - ignore unknown arguments
  passWithNoTests: false,
  bail: false,
  
  // Handle VS Code Jest extension temp files by ignoring unknown CLI arguments
  // This prevents the extension from passing unrecognized file arguments
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
  // Treat TS/JS files as ESM for SWC/Jest
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],
  setupFiles: ['<rootDir>/jest/setEnvVars.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts', '<rootDir>/__mocks__/node.ts'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  transform: {
    '^.+\.(t|j)sx?$': ['@swc/jest', {
      jsc: { transform: { react: { runtime: 'automatic' } } },
      module: { type: 'es6' }
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    '<rootDir>/src/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
    '<rootDir>/app/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/app/**/__tests__/**/*.(ts|tsx|js|jsx)',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/node_modules'],
  watchPathIgnorePatterns: [
    '[\/]tests[\/]',
    '[\/]playwright[\/]'
  ],
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
    '^@auth/mongodb-adapter$': '<rootDir>/__mocks__/@auth/mongodb-adapter.js',
    '^@/__mocks__/(.*)$': '<rootDir>/__mocks__/$1',
    '^@/mocks/server$': '<rootDir>/__mocks__/server.ts',
    '^mocks/server$': '<rootDir>/__mocks__/server.ts',
    '^@sanity/client$': '<rootDir>/__mocks__/@sanity/client.ts',
    '^next-sanity$': '<rootDir>/__mocks__/next-sanity.js',
    '^mongoose$': '<rootDir>/__mocks__/mongoose.ts',
    'node-fetch': '<rootDir>/__mocks__/node-fetch.js',
    '^@/lib/dbConnect(?:\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/dbConnect.js',
    '^@/models/User$': '<rootDir>/__mocks__/@/models/User.js',
    '^@/lib/redis(?:\\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/redis.ts',
    // '^@/lib/auth/adapter$': '<rootDir>/__mocks__/lib/auth/adapter.ts',
    '^@/lib/auth/config(?:\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/auth/config.js',
    '^@/lib/rate-limit(?:\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/rate-limit.js',
    '^@/lib/tokens(?:\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/tokens.js',
    '^@/lib/email(?:\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/email.js',
    '^@/lib/logger(?:\.(?:js|ts))?$': '<rootDir>/__mocks__/lib/logger.js',
    '^embla-carousel-react$': '<rootDir>/__mocks__/embla-carousel-react.js',
    '^embla-carousel-autoplay$': '<rootDir>/__mocks__/embla-carousel-autoplay.js',
    '^leaflet$': '<rootDir>/__mocks__/leaflet.ts',
    'leaflet/dist/leaflet.css$': '<rootDir>/__mocks__/leaflet/dist/leaflet.css.js',
    'leaflet.markercluster/dist/MarkerCluster.css$': '<rootDir>/__mocks__/leaflet.markercluster/dist/MarkerCluster.css.js',
    'leaflet.markercluster/dist/MarkerCluster.Default.css$': '<rootDir>/__mocks__/leaflet.markercluster/dist/MarkerCluster.Default.css.js',
    '\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: '<rootDir>/' })
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(next-auth|@auth|jose|broadcast-channel)/)',
  ],
  testPathIgnorePatterns: [
    // Exclude all Playwright and integration tests - Jest only for unit tests
    '[\/]tests[\/]',
    '[\/]playwright[\/]',
    '[\/]__tests__[\/]__mocks__[\/]',
    '\.d(\\.test)?\.ts$',
    '[\/]src[\/]__tests__[\/]api[\/]search[\/]FORTEST-route\.copy\.skip\.ts$',
    // Temporary files and VS Code Jest extension artifacts
    '\/tmp\/jest_runner_.*\.json$',
    'reporter\.js$',
    '\/\.vscode-server\/.*$',
    // Exclude integration and e2e patterns
    '.*\.(int|integration)\.test\.(ts|tsx)$',
    '.*\.(e2e)\.test\.(ts|tsx)$',
    '.*\.spec\.(ts|tsx)$'
  ],
};
