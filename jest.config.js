module.exports = {
  rootDir: ".",
  transformIgnorePatterns: [
    "/node_modules/(?!(bson|jose|next-auth|openid-client|node-fetch)/)"
  ],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: [
    "<rootDir>/app-next-directory/tests/.*\\.spec\\.ts$",
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
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleDirectories: ['node_modules', '<rootDir>/'],
};
