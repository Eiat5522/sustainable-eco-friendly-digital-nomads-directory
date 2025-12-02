# TypeScript Path Resolution Fix

## Issue

TypeScript was unable to resolve the module `@tests/utils/async-mock-helpers`:

```
Cannot find module '@tests/utils/async-mock-helpers' or its corresponding type declarations.
```

## Root Cause

The helper function was located in `/tests/utils/async-mock-helpers.ts`, but:

1. **Main `tsconfig.json` excludes `/tests` directory** (line 51)
2. VSCode uses the main `tsconfig.json` for type checking
3. Even though `tsconfig.test.json` could include it, VSCode doesn't use that config for editor features

## Solution

**Moved the helper to an included directory:**

```bash
# From (excluded):
/tests/utils/async-mock-helpers.ts

# To (included via @/* alias):
/src/test-helpers/async-mock-helpers.ts
```

**Updated all imports:**

```typescript
// Before ❌
import { generateAsyncValue } from '@tests/utils/async-mock-helpers';

// After ✅
import { generateAsyncValue } from '@/test-helpers/async-mock-helpers';
```

## Changes Made

### 1. Moved File
```bash
mv tests/utils/async-mock-helpers.ts src/test-helpers/async-mock-helpers.ts
```

### 2. Updated Import Path in 12 Files

All test files now use the new import path:

1. ✅ `app/auth/login/__tests__/page.test.tsx`
2. ✅ `app/auth/signup/__tests__/page.test.tsx`
3. ✅ `app/listings/[slug]/__tests__/page.test.tsx`
4. ✅ `app/search/page.test.tsx`
5. ✅ `app/search/results/page.test.tsx`
6. ✅ `app/search/__tests__/page.test.tsx`
7. ✅ `app/cities/[slug]/page.test.tsx`
8. ✅ `app/__tests__/blog-slug-page.test.tsx`
9. ✅ `app/__tests__/cities-slug-page.test.tsx`
10. ✅ `app/__tests__/listings-slug-page.test.tsx`
11. ✅ `app/__tests__/blog-page.test.tsx`
12. ✅ `app/__tests__/auth-login-page.test.tsx`

### 3. Updated tsconfig.test.json (Bonus)

Added `"tests"` to the include array for completeness:

```json
{
  "include": ["app", "src", "tests", "**/*.ts", "**/*.tsx", "jest.setup.ts"]
}
```

## Verification

✅ **TypeScript errors resolved** - No more "Cannot find module" errors
✅ **Imports work correctly** - Tests can import the helper function
✅ **Tests run successfully** - Import path is valid at runtime

## Why This Location is Better

### `/src/test-helpers/` Advantages:

1. ✅ **Included in main tsconfig** - No TypeScript errors in VSCode
2. ✅ **Standard location** - Other test helpers already exist here
3. ✅ **Consistent with project structure** - Follows existing patterns
4. ✅ **Better organization** - Test utilities grouped together

### Existing Files in `/src/test-helpers/`:
- `createMongoMemoryServer.ts`
- `msw-server-bridge.ts`
- `async-mock-helpers.ts` ← Our new file

## Path Alias Reference

The `@/*` alias maps to `./src/*` as configured in `tsconfig.json`:

```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@mocks/*": ["./__mocks__/*"],
    "@sanity/sanity.types": ["./sanity.types"],
    "@tests/*": ["./tests/*"]  // ← This directory is excluded!
  }
}
```

## Recommendation

For future test utilities, place them in `/src/test-helpers/` to avoid path resolution issues.

---

**Fixed:** December 1, 2025  
**Status:** ✅ TypeScript errors resolved  
**Location:** `/src/test-helpers/async-mock-helpers.ts`  
**Import:** `import { generateAsyncValue } from '@/test-helpers/async-mock-helpers';`
