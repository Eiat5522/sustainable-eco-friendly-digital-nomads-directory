# Testing Documentation - App Next Directory

**Last Updated:** November 1, 2025  
**Status:** ✅ Active Development

## Overview

This document provides comprehensive testing guidance for the `app-next-directory` workspace. The project uses a **multi-layered testing strategy** with Playwright for E2E tests and Jest for unit and integration tests.

---

## Table of Contents

- [Testing Architecture](#testing-architecture)
- [Test Types](#test-types)
- [Quick Start](#quick-start)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Configuration](#test-configuration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Testing Architecture

### Tech Stack

| Tool | Purpose | Usage |
|------|---------|-------|
| **Playwright** | E2E browser automation | Cross-browser testing (Chromium, Firefox, WebKit) |
| **Jest** | Unit & integration testing | Component testing, API logic, utilities |
| **React Testing Library** | Component testing | User-centric component testing |
| **mongodb-memory-server** | Integration testing | In-memory MongoDB for integration tests |
| **MSW** | API mocking | Mock Service Worker for API requests |

### Test Directory Structure

```
app-next-directory/
├── tests/
│   ├── e2e/                        # Playwright E2E tests
│   │   ├── auth/                   # Authentication flows
│   │   ├── api/                    # API endpoint tests
│   │   ├── city/                   # City pages and map
│   │   ├── filters/                # Search and filtering
│   │   ├── a11y/                   # Accessibility tests
│   │   ├── security/               # Security tests
│   │   └── ux/                     # User experience tests
│   ├── helpers/                    # Shared test utilities
│   ├── utils/                      # Test utility functions
│   ├── README.md                   # Test suite overview
│   ├── WRITING_GUIDE.md           # How to write tests
│   ├── API-MOCKING.md             # API mocking guide
│   └── PREVIEW_TESTING.md         # Preview testing guide
├── src/
│   └── **/__tests__/              # Jest unit tests (co-located)
├── __mocks__/                     # Mock implementations
├── jest.config.cjs                # Jest unit test config
├── jest.integration.config.cjs    # Jest integration test config
├── jest.e2e.config.cjs           # Jest legacy E2E config (deprecated)
└── playwright.config.ts           # Playwright configuration
```

---

## Test Types

### 1. Unit Tests (Jest)

**Purpose:** Test individual components, functions, and modules in isolation.

**Location:** Co-located with source files in `src/**/__tests__/` directories

**Naming Convention:** `*.test.ts` or `*.test.tsx`

**Characteristics:**
- Fast execution (milliseconds)
- Mocked dependencies
- Focus on logic and behavior
- High code coverage

**Run Command:**
```bash
npm run test:unit
# or from root
pnpm --filter app-next-directory test:unit
```

**Example:**
```typescript
// src/components/search/__tests__/SearchForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import SearchForm from '../SearchForm';

describe('SearchForm', () => {
  it('should render search input', () => {
    render(<SearchForm />);
    expect(screen.getByPlaceholderText('Search listings...')).toBeInTheDocument();
  });

  it('should handle search submission', () => {
    const onSearch = jest.fn();
    render(<SearchForm onSearch={onSearch} />);
    
    const input = screen.getByPlaceholderText('Search listings...');
    fireEvent.change(input, { target: { value: 'coworking' } });
    fireEvent.submit(input.closest('form'));
    
    expect(onSearch).toHaveBeenCalledWith('coworking');
  });
});
```

### 2. Integration Tests (Jest)

**Purpose:** Test interactions between components, database operations, and API integrations.

**Location:** Co-located with source files, typically in `src/**/__tests__/` directories

**Naming Convention:** `*.integration.test.ts` or `*.int.test.ts`

**Characteristics:**
- Uses real MongoDB (mongodb-memory-server)
- Tests data persistence and queries
- Tests API route handlers
- Slower than unit tests

**Run Command:**
```bash
npm run test:integration
# or from root
pnpm --filter app-next-directory test:integration
```

**Example:**
```typescript
// src/models/__tests__/Listing.integration.test.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Listing from '../Listing';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Listing Model Integration', () => {
  it('should create and retrieve a listing', async () => {
    const listingData = {
      title: 'Eco Coworking Space',
      city: 'Barcelona',
      category: 'coworking'
    };
    
    const listing = await Listing.create(listingData);
    const found = await Listing.findById(listing._id);
    
    expect(found.title).toBe(listingData.title);
  });
});
```

### 3. End-to-End Tests (Playwright)

**Purpose:** Test complete user workflows and interactions in a real browser.

**Location:** `tests/e2e/` directory

**Naming Convention:** `*.spec.ts`

**Characteristics:**
- Tests real browser behavior
- Cross-browser testing
- Simulates actual user interactions
- Can mock API responses for consistency

**Run Command:**
```bash
npm run test:e2e
# or from root
pnpm --filter app-next-directory test:e2e
```

**Note:** The default `test:e2e` command now explicitly targets the `tests/e2e` folder to avoid Playwright scanning other directories under `tests/` that contain non-e2e or Jest-based tests. If you're debugging what Playwright discovers, run:

```bash
pnpm --filter app-next-directory run test:e2e:list
```

**Example:**
```typescript
// tests/e2e/search/search-ux.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test('should search and filter listings', async ({ page }) => {
    await page.goto('/');
    
    // Perform search
    await page.fill('[data-testid="search-input"]', 'coworking');
    await page.click('[data-testid="search-button"]');
    
    // Apply filter
    await page.click('[data-testid="category-filter"]');
    await page.click('text=Coworking Spaces');
    
    // Verify results
    await expect(page.locator('[data-testid="listing-card"]')).toHaveCount(3);
  });
});
```

---

## Quick Start

### Prerequisites

- Node.js 20+ (check: `node --version`)
- pnpm 9+ (install: `npm install -g pnpm`)

### Installation

```bash
# From app-next-directory workspace
npm install

# Install Playwright browsers (done automatically on npm install)
# Or manually:
npx playwright install --with-deps
```

### Running Your First Test

```bash
# Run all tests
npm test

# Run specific test type
npm run test:unit
npm run test:integration
npm run test:e2e

# Run a specific test file
npm run test:e2e tests/e2e/auth.spec.ts
```

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:unit:coverage

# Run in watch mode
npm run test:watch

# Run specific test
npm run test:unit src/components/search/__tests__/SearchForm.test.tsx
```

### Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npm run test:integration src/models/__tests__/Listing.integration.test.ts
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium

# Run specific test file
npm run test:e2e tests/e2e/auth.spec.ts

# Debug mode
npx playwright test --debug
```

### From Monorepo Root

```bash
# Run all tests for app-next-directory
pnpm --filter app-next-directory test

# Run specific test type
pnpm --filter app-next-directory test:unit
pnpm --filter app-next-directory test:integration
pnpm --filter app-next-directory test:e2e
```

---

## Writing Tests

### General Guidelines

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Follow AAA pattern: Arrange, Act, Assert**
4. **Mock external dependencies**
5. **Keep tests isolated and independent**
6. **Use data-testid attributes for reliable element selection**

For detailed guidance on writing tests, see:
- [WRITING_GUIDE.md](../../tests/WRITING_GUIDE.md) - Comprehensive test writing guide
- [API-MOCKING.md](../../tests/API-MOCKING.md) - API mocking strategies

### Unit Test Example

```typescript
// src/lib/__tests__/formatPrice.test.ts
import { formatPrice } from '../formatPrice';

describe('formatPrice', () => {
  it('should format price range correctly', () => {
    expect(formatPrice('$')).toBe('Budget-friendly');
    expect(formatPrice('$$')).toBe('Moderate');
    expect(formatPrice('$$$')).toBe('Premium');
  });

  it('should handle invalid input', () => {
    expect(formatPrice('')).toBe('Price not available');
    expect(formatPrice(null)).toBe('Price not available');
  });
});
```

### E2E Test Example with Mocking

```typescript
// tests/e2e/listings/search.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Listing Search', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for predictable testing
    await page.route('**/api/listings*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          listings: [
            {
              id: 'test-1',
              title: 'Eco Coworking Bangkok',
              category: 'coworking'
            }
          ],
          totalCount: 1
        })
      });
    });
  });

  test('should display search results', async ({ page }) => {
    await page.goto('/listings');
    await expect(page.locator('[data-testid="listing-card"]')).toHaveCount(1);
  });
});
```

---

## Test Configuration

### Jest Configuration

**Unit Tests:** `jest.config.cjs`
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.integration\\.test\\.',
    '\\.int\\.test\\.'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

**Integration Tests:** `jest.integration.config.cjs`
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.integration.test.{ts,tsx}',
    '**/__tests__/**/*.int.test.{ts,tsx}'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
};
```

### Playwright Configuration

**File:** `playwright.config.ts`

Key settings:
- Base URL: `http://localhost:3000`
- Timeout: 30 seconds per test
- Retries: 2 in CI, 0 locally
- Browsers: Chromium, Firefox, WebKit
- Auto-start dev server for local testing

See [playwright.config.ts](../../playwright.config.ts) for full configuration.

### Environment Variables

**Test Environment Variables:**

Create `.env.test` or `.env.local`:

```env
# Test user credentials
TEST_USER_EMAIL=user@example.com
TEST_USER_PASSWORD=password123
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=admin123
TEST_VENUE_OWNER_EMAIL=venue@example.com
TEST_VENUE_OWNER_PASSWORD=venue123

# Database
MONGODB_URI=mongodb://localhost:27017/test_db

# Base URL (optional, defaults to http://localhost:3000)
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

---

## Best Practices

### Unit Testing

1. ✅ Mock all external dependencies
2. ✅ Test edge cases and error conditions
3. ✅ Keep tests fast (< 50ms per test)
4. ✅ Use descriptive test names
5. ✅ One assertion per test when possible
6. ❌ Don't test implementation details
7. ❌ Don't make real network requests

### Integration Testing

1. ✅ Use mongodb-memory-server for database tests
2. ✅ Clean up data between tests
3. ✅ Test data persistence and queries
4. ✅ Test API route handlers with real dependencies
5. ❌ Don't share state between tests
6. ❌ Don't use production database

### E2E Testing

1. ✅ Test critical user workflows
2. ✅ Mock API responses for consistency
3. ✅ Use data-testid attributes for element selection
4. ✅ Test across multiple browsers
5. ✅ Handle loading states and animations
6. ❌ Don't test every possible user interaction (that's unit testing)
7. ❌ Don't rely on exact text matches (use accessible queries)

### General Best Practices

1. **Use Page Object Model** for E2E tests to reduce duplication
2. **Follow AAA Pattern**: Arrange, Act, Assert
3. **Keep tests isolated**: Each test should run independently
4. **Use meaningful test data**: Make test data realistic and descriptive
5. **Handle async operations**: Use proper async/await patterns
6. **Clean up after tests**: Remove test data, close connections
7. **Document complex test setups**: Add comments for non-obvious logic

---

## Troubleshooting

### Common Issues

#### Jest Tests Failing

**Issue:** Tests fail with module resolution errors
```
Cannot find module '@/components/SearchForm'
```

**Solution:** Check `moduleNameMapper` in `jest.config.cjs`:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1'
}
```

#### Playwright Tests Timing Out

**Issue:** Tests timeout waiting for elements
```
Timeout 30000ms exceeded
```

**Solutions:**
1. Increase timeout in `playwright.config.ts`
2. Use proper wait conditions:
```typescript
await page.waitForLoadState('networkidle');
await expect(page.locator('[data-testid="content"]')).toBeVisible();
```

#### MongoDB Connection Issues

**Issue:** Integration tests fail to connect to MongoDB
```
MongooseError: Could not connect to any servers
```

**Solution:** Ensure mongodb-memory-server is properly initialized:
```typescript
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
```

#### MSW Not Intercepting Requests

**Issue:** API mocking not working in tests

**Solution:** Ensure MSW is initialized in test setup:
```typescript
// jest.setup.ts
import { server } from './__mocks__/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Debug Strategies

#### Jest Debugging

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Use VS Code debugger
# Add breakpoint and use "Jest: Debug" launch configuration
```

#### Playwright Debugging

```bash
# Debug mode (pauses before each action)
npx playwright test --debug

# Headed mode (see browser)
npx playwright test --headed

# Slow motion
npx playwright test --headed --slow-mo=1000

# Take screenshots on failure (automatic)
# Check playwright-report/ directory
```

#### Common Debugging Commands

```bash
# Verbose output
npm run test:unit -- --verbose

# Run specific test
npm run test:unit -- -t "test name pattern"

# Generate coverage report
npm run test:unit:coverage

# View Playwright test report
npx playwright show-report
```

---

## Test Status

### Current Testing Status

**Unit Tests:**
- ✅ Component tests (React Testing Library)
- ✅ Utility function tests
- ✅ Schema validation tests
- ⚠️ API handler tests (partial coverage)

**Integration Tests:**
- ✅ Database model tests
- ✅ MongoDB operations
- ✅ API route integration tests
- ⚠️ External service integration (partial)

**E2E Tests:**
- ✅ Authentication flows
- ✅ Search and filtering
- ✅ Listing management
- ✅ Map integration
- ✅ Responsive navigation
- ✅ Accessibility tests
- ✅ Security tests

### Coverage Goals

- **Unit Tests:** 80%+ code coverage ✅
- **Integration Tests:** All API routes covered ⚠️ (in progress)
- **E2E Tests:** Critical user paths covered ✅

---

## Related Documentation

- [Test Writing Guide](../../tests/WRITING_GUIDE.md) - Comprehensive guide to writing tests
- [API Mocking Guide](../../tests/API-MOCKING.md) - How to mock API requests
- [Preview Testing](../../tests/PREVIEW_TESTING.md) - Testing in preview environments
- [E2E Test README](../../tests/e2e/README.md) - E2E test suite documentation
- [Root Testing Docs](../../../../docs/testing/README.md) - Shared testing documentation

---

## Getting Help

- Check existing tests for examples
- Review [WRITING_GUIDE.md](../../tests/WRITING_GUIDE.md) for patterns
- Search for similar issues in test files
- Ask in team chat or create an issue

---

**Maintainer:** Development Team  
**Last Review:** November 1, 2025
