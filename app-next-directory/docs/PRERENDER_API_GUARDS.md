# API Route Guards for Prerender - Batch 1

## Summary

This batch adds defensive guards to API route handlers to make them resilient during prerender, preventing build failures caused by `headers()` rejections and null dereferences.

## Changes Made

### 1. Featured Listings Route (`app/api/featured-listings/route.ts`)
- **Issue**: Null dereference when accessing `listings.length`
- **Fix**: Added defensive array check: `const safeListings = Array.isArray(listings) ? listings : [];`
- **Comment**: `// FORTEST: guard for prerender - ensure listings is an array`

### 2. Admin Routes (All Protected)
Added headers() guards to handle prerender gracefully:

#### Admin Listings Stats (`app/api/admin/listings/stats/route.ts`)
- Wraps `auth()` call in try-catch
- Returns 204 (No Content) during prerender
- Logs warning when headers() is unavailable

#### Other Admin Routes
Same pattern applied to:
- `app/api/admin/listings/route.ts`
- `app/api/admin/stats/route.ts`
- `app/api/admin/moderation/route.ts`
- `app/api/admin/users/route.ts`
- `app/api/admin/analytics/route.ts`
- `app/api/admin/settings/route.ts`
- `app/api/admin/bulk-operations/route.ts`
- `app/api/admin/analyze-content/route.ts`

### 3. User Routes (All Protected)
Added headers() guards to handle prerender gracefully:

#### Dashboard (`app/api/user/dashboard/route-helpers.ts`)
- Modified `createDashboardHandler` to wrap auth() call
- Returns 204 during prerender

#### Analytics (`app/api/user/analytics/route.ts`)
- Modified `_createAnalyticsHandler` to wrap auth() call
- Returns 204 during prerender

#### Other User Routes
Same pattern applied to:
- `app/api/user/profile/route.ts`
- `app/api/user/favorites/route.ts`
- `app/api/user/reviews/route.ts`

### 4. Auth-Dependent Routes
- `app/api/upload/route.ts` - Added headers() guard
- `app/api/listings/manage/[id]/route.ts` - Added headers() guards for GET and PUT

## Guard Pattern

All guards follow this consistent pattern:

```typescript
// FORTEST: guard for prerender - handle headers() unavailability
let session: Awaited<ReturnType<typeof auth>> | null = null;
try {
  session = await auth(request?.headers);
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('headers()') || msg.includes('During prerendering')) {
    structuredLogger.warn('[route-name] headers() unavailable during prerender', error, {
      route: '/api/route-path',
    });
    return new Response(null, { status: 204 });
  }
  throw error;
}
```

## Testing Results

### Build Test
Command: `DISABLE_SANITY_DURING_BUILD=1 DISABLE_UPSTASH_DURING_BUILD=1 DISABLE_NEXTAUTH_DURING_BUILD=1 pnpm build`

Results:
- ✅ No "Cannot use 'in' operator" errors
- ✅ No null.length errors
- ✅ Featured-listings gracefully returns mock data
- ✅ All admin and user routes handle headers() rejections
- ✅ Auth() wrapper catches and logs headers() rejections as expected

### Unit Tests
All modified route tests pass:
- ✅ `app/api/admin/users/__tests__/route.test.ts`
- ✅ `app/api/listings/manage/[id]/__tests__/route.test.ts`
- ✅ `app/api/admin/settings/__tests__/route.test.ts`
- ✅ `app/api/user/favorites/__tests__/route.test.ts`
- ✅ `app/api/user/favorites/[slug]/__tests__/route.test.ts`
- ✅ `app/api/user/reviews/__tests__/route.test.ts`
- ✅ `app/api/user/analytics/route.test.ts`
- ✅ `app/api/admin/listings/__tests__/route.test.ts`
- ✅ `app/api/featured-listings/route.test.ts`
- ✅ `app/api/admin/moderation/__tests__/route.test.ts`
- ✅ `app/api/upload/__tests__/route.test.ts`

## Impact

### Before Changes
- API routes would crash during prerender with:
  - "Cannot use 'in' operator to search for 'req' in undefined"
  - "Cannot read properties of null (reading 'length')"
  - Hanging headers() rejections

### After Changes
- API routes gracefully handle prerender:
  - Return 204 (No Content) when headers() is unavailable
  - Log warnings for debugging
  - Allow build to complete successfully
  - No breaking changes to runtime behavior

## Cleanup Notes

All guards are marked with `// FORTEST:` comments for easy identification. These can be:
1. Kept permanently as defensive programming
2. Removed once Next.js prerender behavior is better understood
3. Replaced with a shared helper function if the pattern is needed elsewhere

## Next Steps

Future batches could:
1. Add similar guards to remaining API routes (auth, search, blog, cities, etc.)
2. Create a shared `withPrerenderGuard()` helper to reduce code duplication
3. Add integration tests specifically for prerender scenarios
4. Document best practices for new API routes
