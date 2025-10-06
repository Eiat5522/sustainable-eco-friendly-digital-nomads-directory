// Temporary Jest config for measuring test utility coverage
const baseConfig = require('./jest.config.cjs');

module.exports = {
  ...baseConfig,
  // Override testPathIgnorePatterns to allow src/tests
  testPathIgnorePatterns: [
    '[\/]playwright[\/]',
    '[\/]__tests__[\/]__mocks__[\/]',
    '\.d(\\.test)?\.ts$',
    '[\/]src[\/]__tests__[\/]api[\/]search[\/]FORTEST-route\.copy\.skip\.ts$',
    '\/tmp\/jest_runner_.*\.json$',
    'reporter\.js$',
    '\/\.vscode-server\/.*$',
    '.*\.(int|integration)\.test\.(ts|tsx)$',
    '.*\.(e2e)\.test\.(ts|tsx)$',
    '.*\.spec\.(ts|tsx)$'
  ],
  // Only collect coverage from src/tests files
  collectCoverageFrom: [
    'src/tests/**/*.{ts,tsx}',
    '!src/tests/**/*.test.{ts,tsx}',
    '!src/tests/**/*.d.ts',
  ],
  coverageThreshold: {
    'src/tests/helpers/assertions.ts': {
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
    },
    'src/tests/helpers/test-data.ts': {
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
    },
    'src/tests/mocks/factories.ts': {
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
    },
  },
};
