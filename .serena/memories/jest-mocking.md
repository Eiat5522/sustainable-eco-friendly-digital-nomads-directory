# Jest Mocking

## Entity Type
Technical Concept

## Description
Jest module mocking techniques for unit testing, including global mocks with jest.mock, isolated mocks with jest.doMock, and dynamic mock access with jest.requireMock.

## Key Features
- jest.mock: Global module mocking hoisted to top of test file
- jest.doMock: Isolated module mocking within jest.isolateModulesAsync
- jest.requireMock: Access mocked modules in isolated contexts
- jest.Mock<any>: TypeScript typing for mock functions
- Mock implementation functions for controlling return values

## Usage in Tests
- Mock external dependencies like @sanity/client, @/lib/logger
- Handle module isolation for tests with different environments
- Assert on mock function calls with toHaveBeenCalledWith
- Clear mocks between tests with jest.clearAllMocks

## Related Problems Solved
- Structured logger mocking in isolated modules
- Sanity client createClient mocking
- TypeScript mock typing issues

## Current Status
Actively used in sanity-http-client.test.ts debugging