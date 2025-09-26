# Jest vs Playwright Test Separation - Fix Summary

## Problem Solved

**Original Issue**: VS Code Jest extension was failing with "No tests found" error after every restart due to conflicting test directory structures between Jest and Playwright.

## Root Cause

1. **Duplicate Test Directories**: Both Jest and Playwright were trying to run tests from the same directories:
   - `tests/api/` (API integration tests)
   - `tests/cross-browser/` (Cross-browser compatibility tests)
   - `tests/security/` (Security tests)
   - `tests/ux/` (UX workflow tests)
   - `tests/CityCarousel.test.tsx` (Component test)

2. **VS Code Extension Issues**: The Jest extension was passing temporary file arguments that Jest couldn't handle, causing pattern matching failures.

## Solution Applied

### 1. **Test Separation**
- **Jest**: Now handles only unit tests in `src/` and `app/` directories (77 tests)
- **Playwright**: Handles all integration/e2e tests in `tests/e2e/` directory (12 tests)

### 2. **Directory Restructure**
```bash
# Moved integration tests to proper Playwright structure
tests/api/ → tests/e2e/api/
tests/cross-browser/ → tests/e2e/cross-browser/
tests/security/ → tests/e2e/security/
tests/ux/ → tests/e2e/ux/
tests/CityCarousel.test.tsx → src/components/sections/__tests__/CityCarousel.test.tsx
```

### 3. **Configuration Updates**

#### Jest Configuration (`jest.config.cjs`):
- Updated `testMatch` to only target `src/` and `app/` directories
- Updated `testPathIgnorePatterns` to exclude entire `tests/` directory
- Added filtering for VS Code extension artifacts

#### VS Code Settings (`.vscode/settings.json`):
- Created wrapper script to filter problematic arguments
- Set `jest.jestCommandLine` to use custom wrapper
- Configured `jest.runMode` to "on-demand" for stability

### 4. **Wrapper Script** (`scripts/jest-vscode.sh`):
- Filters out VS Code extension temporary files (`/tmp/jest_runner_*.json`)
- Removes problematic arguments (`default`, `reporter.js`)
- Ensures clean Jest execution

## Verification Results

✅ **Jest Unit Tests**: 77 tests found (only in `src/` and `app/`)
✅ **VS Code Wrapper**: Correctly filters arguments and finds same test count
✅ **Playwright Integration Tests**: 12 tests moved to `tests/e2e/` structure
✅ **No More Conflicts**: Jest and Playwright now operate on separate test sets

### 2025-02 Hardening Update
- Migrated the remaining `jest-playwright` suites (`tests/e2e/auth.e2e.test.ts` and
  `tests/e2e/rbac.e2e.test.ts`) to first-class Playwright tests so they now run with
  `@playwright/test` like the rest of the E2E suite.
- Removed the `jest-playwright` triple-slash directives from shared helpers and switched
  to typing against Playwright fixtures.
- Updated `playwright.config.ts` to execute `.e2e.test.ts` files and restricted the legacy
  Jest E2E config to the `tests/legacy/` namespace, eliminating cross-runner conflicts.

## Commands for Testing

```bash
# Jest unit tests
npm run test:unit -- --listTests

# VS Code wrapper (simulating extension behavior)
./scripts/jest-vscode.sh /tmp/temp.json default /reporter.js --listTests

# Playwright integration tests
npm run test:e2e --list

# Count verification
echo "Jest: $(npm run test:unit -- --listTests --passWithNoTests 2>/dev/null | wc -l)"
echo "Moved: $(find tests/e2e/ -name '*.test.*' | wc -l)"
```

## Benefits Achieved

1. **Persistent Fix**: Configuration survives VS Code restarts
2. **Clear Separation**: Unit tests vs integration tests are clearly separated
3. **No False Positives**: Jest extension only sees actual unit tests
4. **Better Organization**: Tests are now logically organized by type
5. **Reliable Testing**: Both Jest and Playwright work without conflicts

## Future Maintenance

- **Adding Unit Tests**: Place in `src/` or `app/` directories following `*.test.*` pattern
- **Adding Integration Tests**: Place in `tests/e2e/` directory for Playwright
- **VS Code Issues**: The wrapper script handles extension quirks automatically
- **Test Running**: Use `npm run test:unit` for Jest, `npm run test:e2e` for Playwright

This fix ensures the VS Code Jest extension will work reliably across restarts while maintaining proper test separation.