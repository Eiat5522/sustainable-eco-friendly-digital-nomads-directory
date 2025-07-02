module.exports = {
  rootDir: ".",
  transformIgnorePatterns: [
    "/node_modules/(?!(bson|jose|next-auth|openid-client|node-fetch|@panva/hkdf|jose|next-auth/jwt)/)"
  ],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: [
    "<rootDir>/app-next-directory/tests/e2e/",
    "<rootDir>/app-next-directory/tests/performance/",
    "<rootDir>/app-next-directory/tests/security/",
    "<rootDir>/app-next-directory/tests/ux/",
    "<rootDir>/app-next-directory/tests/visual/",
    "<rootDir>/app-next-directory/tests/cross-browser/",
    "<rootDir>/app-next-directory/tests/api/", // Exclude all Playwright API tests
    "<rootDir>/sanity/",
    "<rootDir>/sanity-backup/"
  ],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  verbose: true,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
    '^.+\\.js$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app-next/types/(.*)$': '<rootDir>/app-next-directory/src/types/$1',
    '^@app-next/(.*)$': '<rootDir>/app-next-directory/src/$1',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
};
