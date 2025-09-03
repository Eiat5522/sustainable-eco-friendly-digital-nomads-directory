# Sanity Package Updates Migration Notes

## Changes Made

This document outlines the updates made to the Sanity package configuration to ensure compatibility with modern Node.js versions and Sanity v4.6+.

### 1. Added Engine Constraints

Added `engines` field to `sanity/package.json` requiring Node.js >=20.19.0:

```json
{
  "engines": {
    "node": ">=20.19.0"
  }
}
```

### 2. Updated Sanity Packages

- **@sanity/code-input**: Updated from `5.1.2` to `^6.0.0` for React 19 compatibility
- **@sanity/vision**: Updated from `^4.6.1` to `^4.8.1` for latest features and fixes
- **sanity**: Updated from `^4.6.1` to `^4.8.1` for latest core features

### 3. Removed Legacy Dependencies

- **@sanity/cli**: Removed from devDependencies (was `^3.99.0`)
  - This package is deprecated for newer Sanity versions
  - Use `npx sanity@latest <command>` instead of installed CLI

### 4. Documentation Updates

Updated `sanity/README.md`:
- Changed Node.js requirement from 18.17.0+ to 20.19.0+
- Added migration note about CLI usage
- Added section explaining npx sanity@latest usage

### 5. CI/Build Compatibility

The existing CI workflows already use Node.js 20, so no changes needed for:
- `.github/workflows/pull-request.yml`
- `.github/workflows/security-audit.yml`

## Migration Steps for Developers

1. **Update Node.js**: Ensure you're running Node.js 20.19.0 or higher
2. **Install Dependencies**: Run `pnpm install` in the sanity directory
3. **CLI Usage**: Replace any `sanity` commands with `npx sanity@latest`
4. **Verify Compatibility**: Test all Sanity-related functionality

## React 19 Compatibility

All updated packages are verified to work with React 19:
- @sanity/code-input v6.0.0+ supports React 19
- @sanity/vision and sanity core packages support React 19
- Other dependencies remain compatible

## Breaking Changes

- **@sanity/cli removal**: Any scripts relying on a globally installed or locally installed `@sanity/cli` should use `npx sanity@latest` instead
- **Node.js requirement**: Projects must now use Node.js 20.19.0 or higher

---

_Migration completed: September 4, 2025_