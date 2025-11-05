# Playwright Browser Installation

## Overview

This directory contains the postinstall script for Playwright browser installation that handles the known RangeError issue during browser downloads.

## Files

- `postinstall-playwright.cjs` - Smart postinstall script for Playwright browsers

## How It Works

The script automatically:

1. **Detects CI environments** and skips installation (CI handles it separately)
2. **Checks for cached browsers** to avoid redundant downloads
3. **Handles errors gracefully** - never fails package installation
4. **Provides clear instructions** when manual installation is needed

## Environment Variables

- `SKIP_PLAYWRIGHT_INSTALL=1` - Skip browser installation entirely
- `FORCE_PLAYWRIGHT_INSTALL=1` - Force browser reinstallation even if cached
- `CI=1` or `CI=true` - Automatically detected, triggers skip
- `NODE_ENV=production` - Skips installation in production

## Manual Installation

If the automatic installation fails or you need to install browsers manually:

```bash
# Install Chromium only (faster)
pnpm --filter app-next-directory exec playwright install chromium

# Install all browsers with system dependencies
pnpm --filter app-next-directory exec playwright install --with-deps

# Force reinstall
FORCE_PLAYWRIGHT_INSTALL=1 pnpm --filter app-next-directory install
```

## CI/CD Integration

The GitHub Actions workflows are configured to:

1. Skip Playwright installation during `pnpm install` (using `SKIP_PLAYWRIGHT_INSTALL=1`)
2. Install browsers separately with caching support
3. Use `playwright install chromium --with-deps` for faster CI builds

## Troubleshooting

### RangeError: Invalid count value: Infinity

This is a known issue with Playwright's progress bar calculation. Our script handles this gracefully:

- The error is caught and reported as a warning
- Package installation continues successfully
- Instructions for manual installation are provided

### Browsers not found when running tests

If you see "Executable doesn't exist" errors:

```bash
# Install browsers manually
pnpm --filter app-next-directory exec playwright install chromium
```

### CI builds failing

Check that:
1. `SKIP_PLAYWRIGHT_INSTALL=1` is set during dependency installation
2. A separate step installs browsers with `playwright install chromium --with-deps`
3. Browser cache is properly configured (if using caching)

## Related Issues

- Issue #12 in CONSOLE_ERRORS_CLASSIFICATION.md
- GitHub issue: Playwright progress bar RangeError
