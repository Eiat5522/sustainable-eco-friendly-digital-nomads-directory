# Bug Fix Report: Legacy City Alias Component

## Issue Identified

**File:** `app/city/[slug]/__tests__/page.test.tsx`

**Failing Tests:**
1. `LegacyCityAlias page › permanently redirects to the updated city route`
2. `LegacyCityAlias page › encodes complex slugs before redirecting`

**Error:**
```
Expected: "/cities/barcelona"
Received: "/cities/undefined"
```

## Root Cause

### The Source Component is Synchronous (NOT Async)

**File:** `app/city/[slug]/page.tsx`

```typescript
type Props = {
  params: { slug: string };  // ❌ NOT Promise<{ slug: string }>
};

export default function LegacyCityAlias({ params }: Props) {
  permanentRedirect(`/cities/${encodeURIComponent(params.slug)}`);
}
```

**Why this component is synchronous:**
- It's a **legacy redirect/alias** from `/city/[slug]` → `/cities/[slug]`
- Simple redirect doesn't need async
- No data fetching, just a URL redirect
- Expects `params.slug` to be a string immediately

### What We Did Wrong

We applied `generateAsyncValue()` to a **synchronous component**:

```typescript
// ❌ WRONG - Component expects sync params
LegacyCityAlias({ params: generateAsyncValue({ slug: 'barcelona' }) });

// What actually happened:
// params = Promise { { slug: 'barcelona' } }
// params.slug = undefined (trying to access .slug on a Promise object)
// Result: redirect to '/cities/undefined'
```

## Fix Applied

**Reverted to synchronous params** since the component itself is synchronous:

```typescript
// ✅ CORRECT - Synchronous params for synchronous component
LegacyCityAlias({ params: { slug: 'barcelona' } });
```

**Changes:**
1. Removed import of `generateAsyncValue`
2. Changed both test cases back to synchronous params

## Verification

✅ Both tests now pass:
- `permanently redirects to the updated city route` - PASS
- `encodes complex slugs before redirecting` - PASS

## Lesson Learned

**Not all Next.js components use async params!**

### When to Use `generateAsyncValue()`:
✅ **Async Server Components** (most pages in Next.js 16)
✅ Components with `params: Promise<{ ... }>`
✅ Components with `searchParams: Promise<{ ... }>`

### When NOT to Use `generateAsyncValue()`:
❌ **Client Components** (use `useParams()` hook)
❌ **Synchronous redirect components** (like this legacy alias)
❌ Components with `params: { ... }` (no Promise wrapper)

## Updated File Count

**Files Modified for Async Mock Helpers:** 12 files (down from 13)

**Excluded:**
- `app/city/[slug]/__tests__/page.test.tsx` - Synchronous component

**Included (Correctly):**
1. `app/__tests__/listings-slug-page.test.tsx` ✅
2. `app/listings/[slug]/__tests__/page.test.tsx` ✅
3. `app/cities/[slug]/page.test.tsx` ✅
4. `app/__tests__/blog-slug-page.test.tsx` ✅
5. `app/__tests__/cities-slug-page.test.tsx` ✅
6. `app/search/results/page.test.tsx` ✅
7. `app/search/page.test.tsx` ✅
8. `app/search/__tests__/page.test.tsx` ✅
9. `app/auth/login/__tests__/page.test.tsx` ✅
10. `app/auth/signup/__tests__/page.test.tsx` ✅
11. `app/__tests__/blog-page.test.tsx` ✅
12. `app/__tests__/auth-login-page.test.tsx` ✅

---

**Fixed:** December 1, 2025  
**Status:** ✅ Both failures resolved  
**Test Result:** PASS (2/2 tests)
