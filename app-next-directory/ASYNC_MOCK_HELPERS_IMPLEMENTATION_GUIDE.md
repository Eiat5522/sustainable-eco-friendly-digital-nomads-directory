# Async Mock Helpers Implementation Guide

## Overview
This document identifies all files that require the `generateAsyncValue` helper function for testing Next.js 16 async route props (`params` and `searchParams`).

## Helper Function Location
**Path:** `/src/test-helpers/async-mock-helpers.ts`

```typescript
export async function generateAsyncValue<T>(value: T): Promise<T> {
  return value;
}
```

## Usage Pattern

### Before (Incorrect - Synchronous)
```typescript
const element = await pageModule.default({ 
  params: { slug: 'test-slug' } 
});
```

### After (Correct - Asynchronous)
```typescript
import { generateAsyncValue } from '@/tests/utils/async-mock-helpers';

const element = await pageModule.default({ 
  params: generateAsyncValue({ slug: 'test-slug' })
});
```

## Files Requiring Updates

### 1. Page Component Test Files (Using `params`)

#### ✅ `/app/listings/[slug]/__tests__/page.test.tsx`
- **Lines to update:** 101, 120, 130, 191, 221, 233, 251, 288
- **Pattern:** `params: { slug: string }`
- **Update to:** `params: generateAsyncValue({ slug: string })`

#### ✅ `/app/city/[slug]/__tests__/page.test.tsx`
- **Lines to update:** 24
- **Pattern:** `params: { slug: string }`
- **Update to:** `params: generateAsyncValue({ slug: string })`

#### ✅ `/app/cities/[slug]/page.test.tsx`
- **Pattern:** `params: { slug: string }`
- **Update to:** `params: generateAsyncValue({ slug: string })`

#### ✅ `/app/__tests__/blog-slug-page.test.tsx`
- **Pattern:** `params: { slug: string }`
- **Update to:** `params: generateAsyncValue({ slug: string })`

#### ✅ `/app/__tests__/cities-slug-page.test.tsx`
- **Pattern:** `params: { slug: string }`
- **Update to:** `params: generateAsyncValue({ slug: string })`

#### ✅ `/app/__tests__/listings-slug-page.test.tsx`
- **Pattern:** `params: { slug: string }`
- **Update to:** `params: generateAsyncValue({ slug: string })`

### 2. Test Files Using `searchParams`

#### ✅ `/app/search/results/page.test.tsx`
- **Lines to update:** 78, 115, 144, 178, 269, 285
- **Pattern:** `searchParams: Promise.resolve({ ... })`
- **Update to:** `searchParams: generateAsyncValue({ ... })`
- **Note:** Already uses Promise pattern, can be simplified with helper

#### ✅ `/app/search/page.test.tsx`
- **Pattern:** `searchParams: { ... }`
- **Update to:** `searchParams: generateAsyncValue({ ... })`

#### ✅ `/app/search/__tests__/page.test.tsx`
- **Pattern:** `searchParams: { ... }`
- **Update to:** `searchParams: generateAsyncValue({ ... })`

#### ✅ `/app/auth/login/__tests__/page.test.tsx`
- **Pattern:** `searchParams: { ... }`
- **Update to:** `searchParams: generateAsyncValue({ ... })`

#### ✅ `/app/auth/signup/__tests__/page.test.tsx`
- **Pattern:** `searchParams: { ... }`
- **Update to:** `searchParams: generateAsyncValue({ ... })`

#### ✅ `/app/__tests__/blog-page.test.tsx`
- **Pattern:** `searchParams: { ... }`
- **Update to:** `searchParams: generateAsyncValue({ ... })`

#### ✅ `/app/__tests__/auth-login-page.test.tsx`
- **Pattern:** `searchParams: { ... }`
- **Update to:** `searchParams: generateAsyncValue({ ... })`

### 3. API Route Test Files (Using `params`)

#### ⚠️ `/app/api/listings/manage/[id]/__tests__/route.test.ts`
- **Lines to update:** Multiple (73, 109, 125, 140, 158, 174, 210, 238, 268, 292, 317, 333, 354, 379, 405, 434, 472, 490, 510, 535)
- **Pattern:** `params: { id: string }`
- **Note:** API routes may handle params differently. Check if they expect Promise-based params in Next.js 16
- **Type definition:** `params: { id: string } | Promise<{ id: string }>` (line 43)
- **Update to:** `params: generateAsyncValue({ id: string })`

## Implementation Steps

### Step 1: Import the Helper
Add to the top of each test file:
```typescript
import { generateAsyncValue } from '@/tests/utils/async-mock-helpers';
```

### Step 2: Replace Synchronous Params
Replace all instances of:
- `params: { ... }` → `params: generateAsyncValue({ ... })`
- `searchParams: { ... }` → `searchParams: generateAsyncValue({ ... })`
- `searchParams: Promise.resolve({ ... })` → `searchParams: generateAsyncValue({ ... })`

### Step 3: Verify Async/Await Pattern
Ensure the test properly awaits the component:
```typescript
const element = await pageModule.default({ 
  params: generateAsyncValue({ slug: 'test' })
});
render(element);
```

## Page Components with Async Props (Source Files)

These source files already properly declare async params/searchParams:

### Pages with `params: Promise<{ slug: string }>`
- `/app/listings/[slug]/page.tsx` ✅
- `/app/cities/[slug]/page.tsx` (if exists)
- `/app/blog/[slug]/page.tsx` (if exists)

### Pages with `searchParams: Promise<SearchParamRecord>`
- `/app/search/results/page.tsx` ✅

### API Routes with `params: Promise<{ ... }>`
- `/app/api/listings/[slug]/views/route.ts`
- `/app/api/listings/[slug]/route.ts`
- `/app/api/listings/city/[id]/route.ts`
- `/app/api/city/[slug]/route.ts`
- `/app/api/cities/[slug]/route.ts`
- `/app/api/user/favorites/[slug]/route.ts`
- `/app/api/blog/[slug]/route.ts`
- `/app/api/reviews/listing/[slug]/route.ts`
- `/app/api/reviews/[reviewId]/vote/route.ts`

## Summary

**Total Test Files Requiring Updates:** ~15-20 files

### By Category:
- **Page Component Tests (params):** 6 files
- **Page Component Tests (searchParams):** 7 files  
- **API Route Tests (params):** 1 file (with 20+ test cases)

### Priority Order:
1. **High:** Page component tests with `params` (user-facing features)
2. **High:** Page component tests with `searchParams` (search functionality)
3. **Medium:** API route tests (backend functionality)

## Testing After Implementation

After updating each file, run its tests to verify:
```bash
npm test -- path/to/test-file.test.tsx
```

Or run all tests:
```bash
npm test
```

## Notes

- The helper function is intentionally simple and returns a Promise immediately
- This pattern ensures tests match Next.js 16's async contract
- Some tests already use `Promise.resolve()` - these can be simplified with `generateAsyncValue`
- API routes may have different behavior - verify they actually expect Promise-based params

## References

- **Documentation:** `/docs/app-next-directory/ADVANCE_MOCKING_STRATEGIES_FOR_NEXTJS_APPLICATION_WITH_JEST.md` (Section 3.2)
- **Helper Function:** `/src/test-helpers/async-mock-helpers.ts`
