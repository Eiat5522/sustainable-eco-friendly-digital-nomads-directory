# API Route Test Coverage Summary

## Overview

This document summarizes the test coverage added for 10 API routes that previously had no tests.

**Total Tests Added**: 170 tests across 10 API routes
**Status**: ✅ All tests passing

## Test Files Created

### 1. Legacy Listings API (`app/api/legacy-listings`)
**File**: `app/api/legacy-listings/__tests__/route.test.ts`
**Tests**: 10
**Coverage**:
- ✅ Reading listings from JSON file
- ✅ Empty listings handling
- ✅ Complete listing data handling
- ✅ File read errors (not found, permission denied)
- ✅ JSON parsing errors
- ✅ Response structure validation
- ✅ Error logging

### 2. Listing Views API (`app/api/listings/[slug]/views`)
**File**: `app/api/listings/[slug]/views/__tests__/route.test.ts`
**Tests**: 13
**Coverage**:
- ✅ Recording listing views with slug
- ✅ Custom viewedAt timestamp handling
- ✅ Invalid timestamp fallback
- ✅ Slug validation (missing, invalid type)
- ✅ Request without JSON body
- ✅ recordListingView failure handling
- ✅ JSON parse error handling
- ✅ Response structure validation
- ✅ Async params handling

### 3. City Listings API (`app/api/listings/city/[id]`)
**File**: `app/api/listings/city/[id]/__tests__/route.test.ts`
**Tests**: 15
**Coverage**:
- ✅ Fetching listings by city ID
- ✅ Single and multiple listings
- ✅ Complete listing data with location
- ✅ City ID with hyphens and numbers
- ✅ Empty listings (404)
- ✅ Null/undefined return values
- ✅ Database errors
- ✅ Sanity API errors
- ✅ Network errors
- ✅ Error logging
- ✅ Response structure validation
- ✅ Async params handling

### 4. Manage Listings API (`app/api/listings/manage/[id]`)
**File**: `app/api/listings/manage/[id]/__tests__/route.test.ts`
**Tests**: 19
**Coverage**:

**GET Endpoint**:
- ✅ Fetching listing for venue owner
- ✅ Authentication checks (missing user, wrong role, no ID)
- ✅ Listing not found (404)
- ✅ Fetch errors (500)

**PUT Endpoint**:
- ✅ Updating listing as owner
- ✅ City reference updates
- ✅ Array references (ecoFocusTags, digitalNomadFeatures, amenities)
- ✅ Invalid city reference validation
- ✅ Update failures

**DELETE Endpoint**:
- ✅ Deleting listing as owner
- ✅ Authorization checks
- ✅ Delete failures

**General**:
- ✅ Async params handling
- ✅ Authorization across all methods

### 5. Mock Environment API (`app/api/mock-env`)
**File**: `app/api/mock-env/__tests__/route.test.ts`
**Tests**: 13
**Coverage**:
- ✅ Current environment settings
- ✅ NODE_ENV updates via headers
- ✅ Preview secret updates (masked in response)
- ✅ Both NODE_ENV and secret updates
- ✅ Development/production/test environments
- ✅ Invalid NODE_ENV value handling
- ✅ Empty header values
- ✅ Response structure with no-cache headers
- ✅ Secret masking security
- ✅ Environment transitions

### 6. Newsletter Confirmation API (`app/api/newsletter/confirm`)
**File**: `app/api/newsletter/confirm/__tests__/route.test.ts`
**Tests**: 16
**Coverage**:
- ✅ Valid token confirmation
- ✅ Email normalization (lowercase, trim)
- ✅ Development mode without MONGODB_URI
- ✅ Production mode without MONGODB_URI
- ✅ Missing token redirect
- ✅ Invalid/expired token redirect
- ✅ Database connection errors
- ✅ Database update errors
- ✅ Malformed URL handling
- ✅ Empty token handling
- ✅ Special characters in token
- ✅ Plus addressing in email
- ✅ Email subdomain handling
- ✅ Redirect behavior with origin preservation
- ✅ HTTPS protocol maintenance

### 7. Web Vitals Performance API (`app/api/performance/web-vitals`)
**File**: `app/api/performance/web-vitals/__tests__/route.test.ts`
**Tests**: 19
**Coverage**:
- ✅ Valid metric data processing
- ✅ Status assignment (good, needs-improvement, poor)
- ✅ LCP, FID, CLS metrics
- ✅ Page information inclusion
- ✅ User-agent handling (present, missing, full string)
- ✅ IP address handling (present, missing, multiple IPs)
- ✅ JSON parsing errors
- ✅ Error logging
- ✅ Missing metric name handling
- ✅ Alert processing error handling
- ✅ Metrics without budget
- ✅ Response structure validation

### 8. Preview Mode API (`app/api/preview`)
**File**: `app/api/preview/__tests__/route.test.ts`
**Tests**: 20
**Coverage**:
- ✅ Valid token and slug preview activation
- ✅ Redirect to listings, blog, city paths
- ✅ Preview without type parameter
- ✅ Slug with hyphens
- ✅ Invalid token (401)
- ✅ Missing token (401)
- ✅ Empty token (401)
- ✅ Token with special characters
- ✅ Missing slug (400)
- ✅ Empty slug (400)
- ✅ Path construction for different types
- ✅ Undefined/null type handling
- ✅ Security - token validation before processing
- ✅ URL-encoded slug
- ✅ Multiple query parameters

### 9. Preview Exit API (`app/api/preview/exit`)
**File**: `app/api/preview/exit/__tests__/route.test.ts`
**Tests**: 26
**Coverage**:
- ✅ Disable draft mode and redirect
- ✅ Redirect to homepage (default)
- ✅ Custom redirect paths (listings, blog, cities, etc.)
- ✅ Absolute URL construction from relative path
- ✅ Request origin preservation
- ✅ Paths with query parameters
- ✅ Encoded redirect paths
- ✅ Draft mode operations (disable called)
- ✅ Response structure (302 status, Location header, null body)
- ✅ Empty redirect parameter
- ✅ Redirect with hash
- ✅ Root path redirect
- ✅ Nested path redirect
- ✅ Multiple query parameters extraction
- ✅ Safe redirect URL construction
- ✅ Different origins (localhost, production, staging)

### 10. Revalidate API (`app/api/revalidate`)
**File**: `app/api/revalidate/__tests__/route.test.ts`
**Tests**: 19
**Coverage**:
- ✅ Valid token path revalidation
- ✅ Leading slash addition
- ✅ Homepage revalidation
- ✅ Nested paths
- ✅ Paths with hyphens
- ✅ Invalid token (401)
- ✅ Missing token (401)
- ✅ Empty token (401)
- ✅ Case-sensitive token comparison
- ✅ Missing path (400)
- ✅ Path with protocol (400)
- ✅ Directory traversal attack prevention (400)
- ✅ Empty path (400)
- ✅ Revalidation failures (500)
- ✅ Error logging
- ✅ Response structure with timestamp
- ✅ Multiple revalidations in sequence

## Test Methodology

### Following Established Patterns

All tests follow the patterns from existing tests in the repository:
- Using `@jest/globals` for imports
- Mocking external dependencies before importing route handlers
- Using `beforeEach` for mock resets and dynamic imports
- Proper TypeScript typing with `NextRequest` and route context types

### Mocking Strategy

**External Services Mocked**:
- `fs.promises.readFile` for file system operations
- `@/lib/sanity` for Sanity CMS client
- `@/lib/auth` for NextAuth authentication
- `@/lib/dbConnect` for MongoDB connections
- `@/models/*` for Mongoose models
- `next/headers` (draftMode) for preview mode
- `next/navigation` (redirect) for redirects
- `next/cache` (revalidatePath) for cache revalidation

### Test Categories

Each test suite includes:

1. **Successful Requests** - Happy path scenarios
2. **Validation** - Input validation and sanitization
3. **Authorization** - Authentication and permission checks
4. **Error Handling** - Various failure scenarios
5. **Edge Cases** - Boundary conditions and special cases
6. **Response Structure** - Response format validation
7. **Security** - Security-related tests

## Test Results

### Current Status
```
Test Suites: 17 passed (for new tests)
Tests:       265 passed (includes some existing tests in matched paths)
Total Project: 2,684 tests passing
```

### Pre-existing Failures (Not Related to This PR)
- 4 tests in `app/__tests__/layout.test.tsx` (ClientRootLayout issues)
- Tests requiring leaflet CSS mock setup

## Running the Tests

### Run All New API Tests
```bash
npm run test:unit -- --testPathPatterns="(legacy-listings|views|city/\[id\]|manage/\[id\]|mock-env|newsletter/confirm|web-vitals|preview|revalidate)"
```

### Run Individual Test Files
```bash
# Legacy listings
npm run test:unit -- app/api/legacy-listings/__tests__/route.test.ts

# Listing views
npm run test:unit -- app/api/listings/[slug]/views/__tests__/route.test.ts

# And so on...
```

### Run All Unit Tests
```bash
npm run test:unit
```

## Guidelines Reference

These tests were created following:
- **TEST_SETUP_GUIDE.md** - Unit test patterns and best practices
- **SOLUTION_SUMMARY.md** - Clear distinction between unit and integration tests
- Existing test patterns in the repository

## Key Principles Applied

1. **Unit Tests Only** - No real database connections or external services
2. **Fast Execution** - All tests run in milliseconds with mocked dependencies
3. **Comprehensive Coverage** - Success, error, edge cases, and security scenarios
4. **Consistent Patterns** - Following established repository conventions
5. **Isolated Tests** - Each test is independent with proper cleanup
6. **Clear Descriptions** - Descriptive test names explaining what is being tested

## Benefits

✅ **Confidence** - Changes to these API routes can be made with confidence
✅ **Documentation** - Tests serve as living documentation of expected behavior
✅ **Regression Prevention** - Catches bugs before they reach production
✅ **Refactoring Safety** - Safe to refactor with tests as guardrails
✅ **CI/CD Ready** - Tests run quickly and reliably in CI environments

## Future Enhancements

Consider adding integration tests for:
- Real database operations for newsletter confirmation
- Real Sanity client operations for listing management
- Real file system operations for legacy listings

These would go in separate `.integration.test.ts` files following the pattern in `TEST_SETUP_GUIDE.md`.
