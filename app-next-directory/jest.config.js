const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // if using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ['node_modules', '<rootDir>/'],
  
  // Handle module aliases (matching paths in tsconfig.json)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@sanity/client$': '<rootDir>/__mocks__/@sanity/client.ts',
    '^jose$': '<rootDir>/__mocks__/jose.js',
    '^preact-render-to-string$': '<rootDir>/__mocks__/preact-render-to-string.js',
    '^next-auth$': '<rootDir>/__mocks__/next-auth.js',
  },
  
  testEnvironment: 'jest-environment-jsdom',
  
  // Test file patterns
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)'],
  
  // Coverage configuration (Keeping existing, as the user didn't specify changes here)
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/layout.{js,jsx,ts,tsx}',
    '!src/app/**/loading.{js,jsx,ts,tsx}',
    '!src/app/**/error.{js,jsx,ts,tsx}',
    '!src/app/**/not-found.{js,jsx,ts,tsx}',
    '!src/app/globals.css',
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  
  // Ignore transforming ESM modules except for these packages (specifically for pnpm)
  transformIgnorePatterns: [
    '/node_modules/(?!\\.pnpm/(?:next-auth|jose|openid-client|preact-render-to-string|preact)(?:@[^/]+)?(?:_[^/]+)?/node_modules/)/'
  ],
  
  // Verbose output
  verbose: true,

  // Treat TypeScript files as ESM for Jest transform (keeping existing as per user's last valid config)
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
