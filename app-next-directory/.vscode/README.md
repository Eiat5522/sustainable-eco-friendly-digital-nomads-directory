# VS Code Jest Testing Configuration

This directory contains configuration files to ensure the VS Code Jest extension works reliably across VS Code restarts after separating Jest (unit tests) from Playwright (integration/e2e tests).

## Test Architecture

### Jest (Unit Tests Only)
- **Location**: `src/` and `app/` directories only
- **Purpose**: Testing individual functions, components, and utilities in isolation
- **Count**: ~77 unit tests
- **Run Command**: `npm run test:unit`

### Playwright (Integration/E2E Tests)
- **Location**: `tests/e2e/` directory
- **Purpose**: API testing, cross-browser testing, security testing, UX workflows
- **Count**: ~12 integration tests (moved from Jest)
- **Run Command**: `npm run test:e2e`

## Files

### 1. `jest.config.cjs`
- **Updated**: Only targets unit tests in `src/` and `app/` directories
- **Excludes**: All `tests/` directory patterns (now handled by Playwright)
- **Filters**: VS Code extension temporary files and reporter artifacts
- **Pattern**: `testMatch` explicitly set to unit test locations only

### 2. `scripts/jest-vscode.sh`
- Wrapper script that filters out problematic arguments passed by VS Code Jest extension
- Prevents "No tests found" errors caused by temporary file arguments
- Automatically executable and handles all VS Code extension integration
- **Key**: Filters `/tmp/jest_runner_*.json`, `default`, and `reporter.js` arguments

### 3. `.vscode/settings.json`
- Configures Jest extension to use the wrapper script
- Sets `jest.jestCommandLine` to `./scripts/jest-vscode.sh`
- Uses `"on-demand"` run mode to prevent automatic execution
- Prevents deprecated settings warnings

### 4. `.vscode/launch.json`
- Debug configurations for running Jest tests in VS Code
- Supports both single file and full test suite debugging
- Only targets unit tests (not integration tests)

## Directory Structure After Separation

```
app-next-directory/
├── src/                          # Unit tests here (Jest)
│   ├── components/__tests__/
│   ├── lib/__tests__/
│   ├── hooks/__tests__/
│   └── __tests__/
├── app/                          # Unit tests here (Jest)
│   └── **/__tests__/
├── tests/                        # Integration tests (Playwright)
│   ├── e2e/                     # Main Playwright tests
│   │   ├── api/                 # API integration tests (moved from Jest)
│   │   ├── cross-browser/       # Cross-browser tests (moved from Jest)
│   │   ├── security/            # Security tests (moved from Jest)
│   │   └── ux/                  # UX workflow tests (moved from Jest)
│   ├── performance/             # Performance tests
│   └── visual/                  # Visual regression tests
```

## How The Fix Works

### Problem Before Fix
- Jest and Playwright had overlapping test directories (`tests/api/`, `tests/security/`, etc.)
- VS Code Jest extension tried to run Playwright tests, causing "No tests found" errors
- Mixed test types caused pattern matching conflicts
- VS Code extension passed temporary file arguments that confused Jest

### Solution Applied
1. **Moved Integration Tests**: Relocated `tests/api/`, `tests/cross-browser/`, `tests/security/`, `tests/ux/` to `tests/e2e/`
2. **Updated Jest Config**: Modified `testMatch` and `testPathIgnorePatterns` to only target unit tests
3. **Created Wrapper Script**: Filters problematic VS Code extension arguments
4. **Clear Separation**: Jest = unit tests only, Playwright = integration/e2e tests only

## Troubleshooting

If tests still don't work after VS Code restart:

1. **Check Jest Extension Status**: Ensure the Jest extension is active in the Extensions panel
2. **Restart Jest**: Use Cmd+Shift+P (Mac) or Ctrl+Shift+P (Linux/Windows) → "Jest: Stop Runner" then "Jest: Start Runner"
3. **Check Working Directory**: Ensure VS Code is opened at the project root directory
4. **Manual Test**: Run `npm run test:unit` in terminal to verify Jest works outside VS Code
5. **Verify Separation**: 
   - `npm run test:unit` should show ~77 tests
   - `./scripts/jest-vscode.sh --listTests` should show same count

## Settings Applied

- `jest.runMode`: `{"type": "on-demand"}` (prevents automatic test running)
- `jest.rootPath`: Points to app-next-directory
- `jest.jestCommandLine`: Uses custom wrapper script `./scripts/jest-vscode.sh`
- `jest.useDashedArgs`: true (proper argument handling)

## Verification Commands

```bash
# Test Jest unit tests only (should show ~77 tests)
npm run test:unit -- --listTests

# Test VS Code wrapper (should show same count)
./scripts/jest-vscode.sh --listTests

# Test Playwright integration tests
npm run test:e2e --list
```

This configuration permanently fixes the VS Code Jest extension issues by maintaining clear separation between unit tests (Jest) and integration tests (Playwright).