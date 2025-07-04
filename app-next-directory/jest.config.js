// Jest config for TypeScript + ESM + alias support
/** @type {import('jest').Config} */
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  setupFiles: ['<rootDir>/jest/setEnvVars.js'],
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: '<rootDir>/' })
  },
  transformIgnorePatterns: [
    'node_modules/(?!(bson|mongodb|mongoose|@?react|@?next|@?sanity|@?testing-library|@?reduxjs|@?babel|@?mui|@?date-io|@?heroicons|@?headlessui|@?popperjs|@?jotai|@?tanstack|@?radix-ui|@?zod|@?lucide|@?stripe|@?swr|@?prisma|@?auth0|@?apollo|@?graphql|@?urql|@?msw))'
  ],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: 'tsconfig.json'
    }
  },
  testPathIgnorePatterns: [
    '/playwright/',
    '\\.playwright\\.test\\.[jt]s$',
    '\\.pw\\.test\\.[jt]s$'
  ]
};
