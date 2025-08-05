module.exports = {
  projects: [
    '<rootDir>/app-next-directory',
    // Add other project roots here if needed
  ],
  moduleNameMapper: {
    '^tree-sitter-.*$': '<rootDir>/__mocks__/tree-sitter-mock.js',
    '^@tree-sitter-grammars/.*$': '<rootDir>/__mocks__/tree-sitter-mock.js',
    '^friendly-snippets$': '<rootDir>/__mocks__/friendly-snippets-mock.js',
    '^@salesforce/cli$': '<rootDir>/__mocks__/salesforce-cli-mock.js',
    '^libgit2$': '<rootDir>/__mocks__/libgit2-mock.js',
    '^salesforce-app$': '<rootDir>/__mocks__/salesforce-app-mock.js',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  verbose: true,
};
