# Console Migration to structuredLogger Plan

## Overview
Found 64 console violations across the codebase that need to be migrated to the custom structuredLogger implementation (pino-based).

## Categories of Console Usage Found

### 1. Mock Files (2 violations)
- `app-next-directory/__mocks__/lib/logger.js` - Mock implementation using console

### 2. Jest Setup Files (6 violations)
- `app-next-directory/jest.setup.ts` - Console.error/warn preservation
- `tests/jest.setup.ts` - Error output for test failures

### 3. Scripts (46 violations)
- `scripts/ci/importValidator.ts` - Error logging and success messages
- `scripts/generate-test-jwt.js` - Error logging and token output
- `scripts/postinstall-msw.cjs` - Installation progress messages
- `scripts/postinstall-playwright.cjs` - Installation progress and error messages
- `scripts/validate-env.js` - Environment validation output

### 4. Logger Implementation (2 violations)
- `app-next-directory/src/lib/logger.ts` - Console access in legacy fallback

### 5. Test Files (2 violations)
- `app-next-directory/src/lib/performance/__tests__/plausible.test.ts` - Test expectations on console.warn

### 6. E2E Setup (1 violation)
- `tests/setup-e2e-db.mjs` - Error handling in database setup

## Migration Strategy

### Priority Order
1. **Scripts** - These are standalone tools that can be easily migrated
2. **E2E Setup** - Important for end-to-end testing
3. **Jest Setup** - Critical for test functionality
4. **Logger Implementation** - Core logging infrastructure
5. **Mock Files** - Test utilities
6. **Test Files** - Test expectations (may need special handling)

### Special Considerations
- **Jest Test Files**: Need to preserve test functionality while removing console usage
- **Console Error/Warn Preservation**: Important for testing framework compatibility
- **Script Output**: Scripts may need to maintain user-facing output
- **Mock Implementations**: Should use structuredLogger internally

## Implementation Steps

### Step 1: Examine structuredLogger Implementation
- Review `app-next-directory/src/lib/logger.ts` to understand API

### Step 2: Migrate Scripts (46 violations)
- Start with simpler scripts and work up to complex ones
- Maintain user-friendly output where needed

### Step 3: Migrate E2E Setup (1 violation)
- Ensure database setup logging is preserved

### Step 4: Migrate Jest Setup (6 violations)
- Preserve test framework functionality
- May need to keep some console access for test compatibility

### Step 5: Migrate Logger Implementation (2 violations)
- Fix internal console usage in structuredLogger

### Step 6: Handle Test Files (2 violations)
- Update test expectations appropriately

### Step 7: Migrate Mock Files (2 violations)
- Update mock implementations to use structuredLogger

### Step 8: Quality Gates
- After each file: run lint, type-check, unit tests
- Final comprehensive check: full repo lint, type-check, tests

## Success Criteria
- [ ] All 64 console violations resolved
- [ ] No regressions in test functionality
- [ ] All lint/type-check passes
- [ ] E2E tests pass
- [ ] User-facing script output maintained where appropriate
