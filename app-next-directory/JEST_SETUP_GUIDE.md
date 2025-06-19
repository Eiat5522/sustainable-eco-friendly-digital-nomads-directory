# Jest Unit Testing Setup Guide

## Overview

Jest has been successfully set up for unit testing in this Next.js application. This guide explains the configuration and how to write and run tests.

## Installation

The following Jest-related packages have been installed:

```json
{
  "devDependencies": {
    "@jest/globals": "^30.0.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/jest": "^30.0.0",
    "jest": "^30.0.1",
    "jest-environment-jsdom": "^30.0.1",
    "ts-jest": "^29.4.0"
  }
}
```

## Configuration Files

### jest.config.js
Main Jest configuration using Next.js Jest integration for optimal compatibility.

### jest.setup.ts
Global test setup file that includes:
- Mock configurations for Next.js router and navigation
- Mock for browser APIs (IntersectionObserver, ResizeObserver, etc.)
- Mock for fetch API
- Testing Library DOM matchers

## Test Scripts

The following npm scripts are available:

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:ci": "jest --ci --coverage --watchAll=false"
}
```

## Test File Structure

Tests should be placed in:
- `src/**/__tests__/**/*.{js,jsx,ts,tsx}` - Dedicated test directories
- `src/**/*.{test,spec}.{js,jsx,ts,tsx}` - Co-located with source files

## Writing Tests

### Basic Test Example

```typescript
// src/__tests__/example.test.ts
import { describe, it, expect } from '@jest/globals';

describe('Basic Test Suite', () => {
  it('should perform basic calculations', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### Testing Utility Functions

```typescript
// src/lib/__tests__/utils.test.ts
import { describe, it, expect } from '@jest/globals';
import { someUtilityFunction } from '../utils';

describe('Utility Functions', () => {
  it('should handle input correctly', () => {
    const result = someUtilityFunction('test input');
    expect(result).toBe('expected output');
  });
});
```

### Testing React Components

```typescript
// src/components/__tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
```

### Testing API Functions with Mocks

```typescript
// src/lib/__tests__/api.test.ts
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { fetchData } from '../api';

describe('API Functions', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('fetches data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await fetchData('/api/test');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('/api/test');
  });
});
```

## Running Tests

### Local Development

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### CI/CD Environment

```bash
# Run tests for continuous integration
npm run test:ci
```

### Running Specific Tests

```bash
# Run tests matching a pattern
npx jest MyComponent

# Run a specific test file
npx jest src/components/__tests__/MyComponent.test.tsx

# Run tests in a specific directory
npx jest src/lib/__tests__
```

## Test Coverage

Jest is configured to collect coverage from:
- All TypeScript/JavaScript files in `src/`
- Excluding type definition files, layouts, loading components, and CSS files

Coverage reports are generated in the `coverage/` directory.

## Mocking

### Next.js Specific Mocks
- `next/router` - Mocked in jest.setup.ts
- `next/navigation` - Mocked in jest.setup.ts
- `next/image` - Can be mocked per test if needed

### External APIs
- `fetch` - Globally mocked in jest.setup.ts
- Other APIs should be mocked in individual test files

### Environment Variables
Test environment variables are set in jest.setup.ts:
```typescript
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
```

## Best Practices

1. **Test Structure**: Use `describe` blocks to group related tests
2. **Test Names**: Use descriptive test names that explain what is being tested
3. **Setup/Teardown**: Use `beforeEach`/`afterEach` for test setup and cleanup
4. **Mocking**: Mock external dependencies and APIs
5. **Assertions**: Use specific assertions that clearly indicate what is expected
6. **Coverage**: Aim for high test coverage but focus on critical paths

## Troubleshooting

### Common Issues

1. **Module Resolution**: Ensure `@/` alias is properly configured in jest.config.js
2. **TypeScript**: Use proper imports from `@jest/globals` for TypeScript support
3. **Next.js Integration**: Use the Next.js Jest configuration for best compatibility
4. **Async Tests**: Remember to `await` async operations in tests

### Debugging Tests

```bash
# Run Jest in debug mode
npx jest --detectOpenHandles --forceExit

# Run with verbose output
npx jest --verbose

# Clear Jest cache
npx jest --clearCache
```

## Integration with Playwright

Jest is configured to exclude Playwright test files (`.spec.ts` files in the `tests/` directory) to avoid conflicts. Playwright tests should be run separately using `npx playwright test`.

## Summary

Jest is now fully configured for unit testing in this Next.js application. The setup includes:
- ✅ Jest and Testing Library installation
- ✅ TypeScript support
- ✅ Next.js integration
- ✅ Mocking setup for Next.js APIs
- ✅ Test scripts configuration
- ✅ Coverage reporting
- ✅ Separation from Playwright e2e tests

You can now write comprehensive unit tests for components, utilities, and API functions.
