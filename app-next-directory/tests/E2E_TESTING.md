# E2E Testing Guide

This document explains the refactored E2E testing setup that provides both true E2E testing with real backend endpoints and integration testing with mocked responses.

## Overview

The testing setup now provides two modes:

1. **True E2E Mode**: Tests run against the real backend with actual database operations
2. **Integration Mode**: Tests run with mocked API responses for frontend-focused testing

## Prerequisites

Before running tests, ensure you have:

- **Node.js**: v18.17.0 or higher
- **MongoDB**: Running locally or configured via `MONGODB_URI`
  - For local: `mongodb://127.0.0.1:27017`
  - For Atlas: Set `MONGODB_URI` environment variable
- **Dependencies**: Run `pnpm install` to install required packages
- **Environment File**: Create `.env.local` with:
  ```

  MONGODB_URI=mongodb://127.0.0.1:27017/e2e_test
  NEXTAUTH_SECRET=your-secret-key
  ```

## Test Files

### E2E Tests (Real Backend)
- **Location**: `tests/e2e/auth.spec.ts`
- **Runs Against**: Real backend API endpoints
- **Database**: Uses test database (configured via `USE_REAL_MONGODB_FOR_E2E=1`)
- **Authentication**: Tests actual user registration and authentication flows

### Integration Tests (Mocked Backend)
- **Location**: `src/__tests__/integration/auth.integration.test.ts`
- **Runs Against**: Frontend with mocked API responses
- **Database**: No database operations
- **Authentication**: Tests UI flow with controlled API responses

+### API-Level Integration Tests
+- **Location**: `tests/auth-api.spec.ts`
+- **Runs Against**: Backend API endpoints
+- **Database**: Uses test database
+- **Purpose**: API contract validation and backend integration

## Running Tests

### E2E Tests (Recommended for CI/Production)
```bash
# Run E2E tests with real backend
pnpm test:e2e

# List E2E tests without running
pnpm test:e2e:list

# Run in debug mode
pnpm test:e2e:debug

# Run with UI
pnpm test:e2e:ui
```

### Integration Tests (For Frontend Development)
```bash
# Run integration tests with mocked responses
pnpm test:e2e:integration

# List integration tests
pnpm test:e2e:integration:list
```

### Legacy Integration Tests (Jest-based)

```bash
# Run Jest-based integration tests
pnpm test:integration
```

## Environment Configuration

### E2E Environment Variables

The E2E tests are configured with isolated environment variables in `playwright.config.ts`:

```typescript
env: {
  NODE_ENV: 'development',
  E2E: '1',
  NEXT_PUBLIC_E2E: '1',
  USE_REAL_MONGODB_FOR_E2E: '1',
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/e2e_test',
  NEXTAUTH_SECRET: 'e2e-test-secret-for-testing-only-not-production',
  // ... other test-specific configs
}
```

### Integration Mode Flag

When `TEST_INTEGRATION=true` is set, the E2E test file enables mocked responses:

### API-Level Integration Tests

- **Location**: `tests/auth-api.spec.ts`
- **Runs Against**: Backend API endpoints
- **Database**: Uses test database
- **Purpose**: API contract validation and backend integration

```typescript
const useMocks = process.env.TEST_INTEGRATION === 'true';

if (useMocks) {
  // Setup mock responses for API endpoints
  page.route('**/api/auth/register', route => 
    route.abort('request')
  );
  page.route('**/api/auth/signin', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    })
  );
}
```

## Test Database Setup

The E2E tests use a dedicated test database to ensure isolation:

1. **Database URI**: Configured via `MONGODB_URI` environment variable
2. **Default**: `mongodb://127.0.0.1:27017/e2e_test`
3. **Setup Script**: `tests/setup-e2e-db.mjs` for database initialization/cleanup

## Migration from Previous Setup

### What Changed

- ✅ Removed hardcoded mocks from `auth.spec.ts`
- ✅ Added optional mocking via `TEST_INTEGRATION` environment flag
- ✅ Created separate integration test file with comprehensive mock scenarios
- ✅ Maintained existing API-level integration tests in `tests/auth-api.spec.ts`
- ✅ Added new npm scripts for different testing modes

### Benefits

1. **True E2E Coverage**: Tests now validate actual backend integration
2. **Flexible Testing**: Choose between real backend or mocked responses
3. **Better Isolation**: Integration tests don't affect production data
4. **Faster Development**: Integration mode for UI-focused development
5. **CI/CD Ready**: Separate modes for different deployment scenarios

## Best Practices

### When to Use Each Mode

**Use E2E Mode (Real Backend)**:

- ✅ Final validation before deployment
- ✅ CI/CD pipeline validation
- ✅ End-to-end user journey testing
- ✅ Database integration verification

**Use Integration Mode (Mocked Backend)**:

- ✅ Frontend development and debugging
- ✅ Rapid UI iteration
- ✅ Testing error states and edge cases
- ✅ Isolated component testing

### Test Data Management

1. **E2E Tests**: Use unique identifiers and proper cleanup
2. **Integration Tests**: Use predictable mock data
3. **Database**: Always use test database for E2E tests

## Troubleshooting

### Common Issues

**Database Connection Issues**:

- Ensure MongoDB is running locally or use MongoDB Atlas
- Check `MONGODB_URI` environment variable

**Test Timeouts**:

- Increase timeout values for slow environments
- Check network connectivity to backend services

**Mock Response Issues**:

- Verify `TEST_INTEGRATION=true` is set for integration mode
- Check that mock responses match expected API contract

### Debug Commands

```bash
# Check what tests are available
pnpm test:e2e:list

# Run specific test file
pnpm test:e2e --grep="registers a new user"

# Run with browser visible
PWDEBUG=1 pnpm test:e2e

# Check integration tests
pnpm test:e2e:integration:list
```

## Future Enhancements

1. **Parallel Test Execution**: Configure Playwright for parallel test runs
2. **Test Data Factories**: Create reusable test data generation utilities
3. **Visual Regression Testing**: Add screenshot comparison for UI changes
4. **Performance Testing**: Add load testing scenarios
5. **Cross-Browser Testing**: Extend to Firefox and Safari testing
