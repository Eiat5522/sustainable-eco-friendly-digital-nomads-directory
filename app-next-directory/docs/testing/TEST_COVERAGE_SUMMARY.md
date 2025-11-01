# Test Coverage Summary for src/tests

## Overview
This document summarizes the test coverage improvements for utility files in `app-next-directory/src/tests/`.

## Coverage Results

### Overall Coverage (src/tests)
- **Statements**: 97.91%
- **Branches**: 93.54%
- **Functions**: 100%
- **Lines**: 97.33%

### Per-File Coverage

#### 1. src/tests/helpers/assertions.ts
**Test File**: `src/tests/helpers/assertions.test.ts`
- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%
- **Tests**: 38 test cases covering all assertion helpers

**Functions Tested**:
- `expectRedirectCalledWith` - Validates redirect calls with URLs and patterns
- `expectNextCalled` - Validates next() middleware calls
- `expectJsonCalled` - Validates JSON response calls
- `expectHeaderSet` - Validates header set operations

#### 2. src/tests/helpers/test-data.ts
**Test File**: `src/tests/helpers/test-data.test.ts`
- **Statements**: 96.82%
- **Branches**: 90.9%
- **Functions**: 100%
- **Lines**: 95.55%
- **Tests**: 71 test cases covering data creation and retrieval

**Functions Tested**:
- `createTestData` - Creates test data with optional overrides
- `getTestUser` - Retrieves test user by role
- `getSessionForRole` - Creates test session for role
- `getFavoritesForUser` - Retrieves user favorites
- `getReviewsForListing` - Retrieves listing reviews
- `getListingBySlug` - Retrieves listing by slug
- `listCities` - Lists all test cities
- `listEcoTags` - Lists all eco tags
- `mockListings` - Export of mock listings

**Uncovered Lines**:
- Line 61: `structuredClone` fallback (environment-specific)
- Line 103: Error path in internal `pickTags` function (edge case)

#### 3. src/tests/mocks/factories.ts
**Test File**: `src/tests/mocks/factories.test.ts`
- **Statements**: 100%
- **Branches**: 100%
- **Functions**: 100%
- **Lines**: 100%
- **Tests**: 16 test cases covering mock factory creation

**Functions Tested**:
- `makeMockRequest` - Creates mock NextRequest objects
- `makeMockResponse` - Creates mock response objects
- `makeMockNextResponse` - Creates mock NextResponse with redirect/next/json methods

## Test Files Created

1. **src/tests/helpers/assertions.test.ts**
   - 38 comprehensive test cases
   - Tests all assertion helper functions
   - Validates success and failure scenarios
   - Tests edge cases like invalid URLs, regex patterns, complex query parameters

2. **src/tests/helpers/test-data.test.ts**
   - 71 comprehensive test cases
   - Tests data creation with overrides
   - Tests data retrieval functions
   - Validates cloning behavior
   - Tests all user roles (user, admin, editor, venueOwner)

3. **src/tests/mocks/factories.test.ts**
   - 16 comprehensive test cases
   - Tests mock request creation
   - Tests mock response creation
   - Tests NextResponse mock with redirect/next/json tracking

## Jest Configuration Updates

Updated `jest.config.cjs` to allow testing of `src/tests` utilities:

```javascript
testPathIgnorePatterns: [
  // Changed from '[\/]tests[\/]' to '^<rootDir>/tests/'
  // This ignores only root-level /tests (Playwright), not src/tests (unit test helpers)
  '^<rootDir>/tests/',
  // ... other patterns
],
watchPathIgnorePatterns: [
  // Changed from '[\/]tests[\/]' to '^<rootDir>/tests/'
  '^<rootDir>/tests/',
  '[\/]playwright[\/]'
],
```

## Running the Tests

### Run all src/tests tests:
```bash
npx jest --config=jest.config.cjs --testPathPatterns="src/tests/.*\.test\.(ts|tsx)"
```

### Run with coverage:
```bash
npx jest --config=jest.config.cjs --coverage --collectCoverageFrom='src/tests/**/*.{ts,tsx}' --collectCoverageFrom='!src/tests/**/*.test.{ts,tsx}' --testPathPatterns="src/tests/.*\.test\.(ts|tsx)"
```

### Run specific test file:
```bash
npx jest --config=jest.config.cjs src/tests/helpers/assertions.test.ts
```

## Conclusion

All utility files in `src/tests` now have comprehensive test coverage exceeding the 85% threshold:

- ✅ assertions.ts: 100% coverage (all metrics)
- ✅ test-data.ts: 96.82% statements, 90.9% branches, 100% functions, 95.55% lines
- ✅ factories.ts: 100% coverage (all metrics)

Total: 125 test cases ensuring robust test utility behavior.
