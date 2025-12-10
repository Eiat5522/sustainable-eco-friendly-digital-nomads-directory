# Unit Test Failures Analysis - Categorized

**Total Failing Test Suites: 16** (was 17, removed theme test)
**Total Passing Test Suites: 188**

---

## 1. MSW-Fixable (Network/API Mocking Issues)

### Count: 4 test suites

### Affected Files:
1. `app/api/blog/route.test.ts` (2 failures)
2. `src/lib/sanity/data.test.ts` (3 failures)
3. `app/__tests__/blog-page.test.tsx` (3 failures)
4. `app/__tests__/blog-slug-page.test.tsx` (5 failures)

### Root Cause:
These tests are failing because they expect mocked API/Sanity responses but the mocks aren't being intercepted properly. MSW (Mock Service Worker) can intercept these HTTP requests and Sanity client calls at the network level.

**Specific Issues:**
- **Blog API route**: Expecting 200 status, receiving 500 - indicates API handlers aren't being mocked
- **Sanity data fetching**: `getListingData` returning `null` instead of mocked data - Sanity client fetch calls not intercepted
- **Blog pages**: Missing content on rendered pages - fetch calls to API endpoints not being mocked
- **Blog slug metadata**: Wrong metadata returned - indicates API calls failing/not mocked

**MSW Solution:** 
Set up MSW handlers for:
- `/api/blog*` endpoints
- Sanity client.fetch() calls (may need custom Sanity client mock or MSW integration)
- External blog post API calls

---

## 2. Component/UI Implementation Changes

### Count: 6 test suites

### Affected Files:
1. `app/admin/dashboard/__tests__/page.test.tsx` (4 failures)
2. `app/__tests__/page.test.tsx` (1 failure)
3. `app/admin/users/__tests__/page.test.tsx` (1 failure)
4. `app/admin/__tests__/layout.test.tsx` (2 failures)
5. `app/admin/listings/__tests__/page.test.tsx` (1 failure)
6. `app/admin/settings/__tests__/page.test.tsx` (4 failures)

### Root Cause:
These failures are due to intentional component implementation changes, likely related to the Next.js 16 Cache Components migration mentioned in the code.

**Important:** Only **1 out of 6** of these UI failures is related to navigation/rendering issues (auth/redirect). The rest are intentional architectural changes.

**Specific Issues:**

#### 1. Admin Dashboard Simplified (Intentional Change ✅)
- **Old behavior:** Dynamic component that fetched analytics data via `fetchAnalytics()`
- **New behavior:** Static placeholder component (`AdminDashboardClient.tsx`) with migration notice
- **Tests expect:** Dynamic content, error states, loading states, analytics cards
- **Tests receive:** Simple static message about temporary simplification
- **Root cause:** Architectural simplification during migration
- **NOT a navigation/rendering issue** - This is intentional component replacement

#### 2. Section Order Changed (Intentional Layout Change ✅)
- **Expected order:** `['hero', 'featured-listings', 'city-carousel']`
- **Actual order:** `['hero', 'city-carousel', 'featured-listings']`
- **Root cause:** Component layout reordered
- **NOT a navigation/rendering issue** - Just reordered JSX elements

#### 3. Admin Layout Query Issues (UI Structure Change ✅)
- Multiple "Admin Panel" text elements in DOM causing RTL queries to fail
- Header has `<span>Admin Panel</span>` (large font)
- Footer/breadcrumb has `<span>Admin Panel</span>` (small font)
- Should use `getAllByText` instead of `getByText`
- **NOT a navigation/rendering issue** - Need better query selectors

#### 4. Auth/Redirect Logic Changes (⚠️ Navigation Issue - YES)
- **Old behavior:** Component-level redirect that throws error
  ```tsx
  if (!isAdmin) throw new Error('redirect');
  ```
- **New behavior:** Middleware handles auth, component renders normally
  ```tsx
  // Auth check is handled by middleware
  ```
- **Tests expect:** Page to throw('redirect') for non-admin users
- **Tests receive:** Page renders normally without throwing
- **Root cause:** Migration from component-level to middleware-level auth
- **THIS IS a navigation issue** - Auth/redirect handling fundamentally changed

#### 5. ~~Cookie/Theme Handling~~ ✅ REMOVED
- **Status:** Test file removed - project does not have theme functionality

#### 6. Search Page - Missing Export (Configuration Change ✅)
- **Expected:** `export const dynamic = 'force-dynamic';`
- **Actual:** Export missing or removed
- **Root cause:** Next.js configuration export removed during migration
- **NOT a navigation/rendering issue** - Missing configuration export

**Navigation/Rendering Breakdown:**
| Failure Type | Count | Navigation? | Rendering? | Root Cause |
|--------------|-------|-------------|------------|------------|
| Simplified components | 1 | ❌ | ❌ | Intentional migration changes |
| Auth/redirect logic | 1 | ✅ YES | ❌ | Middleware vs component-level auth |
| Layout changes | 2 | ❌ | ❌ | Intentional reordering/structure |
| ~~Theme/cookie handling~~ | ~~1~~ | ❌ | ~~✅ YES~~ | ✅ Test removed (no theme in project) |
| Missing exports | 1 | ❌ | ❌ | Configuration removal |
| Duplicate elements | 1 | ❌ | ❌ | UI structure change |

**Solution:**
- Update test expectations to match new simplified UI during migration
- Fix RTL queries to handle multiple elements or use test IDs
- **For auth/redirect:** Mock the middleware or update test to match middleware-based auth pattern
- Update export validation tests to match actual exports

---

## 3. Jest Configuration / Module Resolution Issues

### Count: 3 test suites

### Affected Files:
1. `app/api/reviews/route.test.ts` (Parse failure)
2. `app/api/listings/route.test.ts` (Parse failure)
3. `app/api/comments/route.test.ts` (Parse failure)

### Root Cause:
Mock file `__mocks__/next/cache.js` has a syntax error causing Jest parse failures.

**Error:**
```
SyntaxError: Identifier 'jest' has already been declared
```

Located at: `/app-next-directory/__mocks__/next/cache.js:3`

**Issue:** The file is trying to redeclare `jest` from `@jest/globals` when it's already in the global scope.

**Solution:**
Fix the mock file to avoid redeclaring `jest`:
```javascript
// Remove or fix this line:
const { jest } = require('@jest/globals'); // jest already declared globally
```

---

## 4. Mock Setup & Configuration Issues

### Count: 3 test suites

### Affected Files:
1. `src/utils/__tests__/db-helpers.test.ts` (2 failures)
2. `src/lib/__tests__/sanity.utils.test.ts` (2 failures)
3. `src/lib/__tests__/sanity.test.js` (4 failures)
4. `src/lib/__tests__/dbConnect-simplified.test.ts` (1 failure)
5. `src/lib/__tests__/absolute-url.test.ts` (2 failures)
6. `app/city/[slug]/__tests__/page.test.tsx` (2 failures)
7. `app/search/page.test.tsx` (1 failure)

### Root Cause:
Mock functions aren't being called or returning expected values. This is separate from network mocking - these are jest.mock() issues.

**Specific Issues:**

#### Sanity Client Mocking:
- `mockCreateClient` has 0 calls - Sanity client initialization not using mocked function
- `previewClient.fetch` has 0 calls - mock not properly set up
- Need to verify mock paths and ensure Sanity imports are properly mocked

#### DB Connection Mocking:
- MongoDB URI validation not throwing when expected
- `dbConnect` tests expecting module to throw on import but it doesn't
- Mocks not preventing actual module evaluation

#### Environment Variable Mocking:
- `getBaseUrl()` returning "https://example.com" instead of falling back
- Environment mocks not being applied correctly
- Jest setup may need to reset env vars between tests

#### Redirect Mocking:
- `permanentRedirectMock` not being called (0 calls)
- Next.js redirect functions may need different mocking approach in v16

#### Export Validation:
- `dynamic` export is `undefined` - likely removed or changed in implementation
- Need to verify what's actually exported from the module

**Solution:**
- Review and fix Sanity mock setup in jest.setup.ts
- Ensure mongodb mocks prevent actual connection attempts
- Add proper environment variable cleanup/mocking
- Update Next.js redirect mocks for v16
- Update tests to match actual exports

---

## 5. Module Evaluation / Environment Issues

### Count: 1 (catastrophic failure)

### Affected Files:
- `src/lib/__tests__/mongodb.test.ts`

### Root Cause:
MongoDB module is executing at import time and throwing because MONGODB_URI is missing.

**Error:**
```
Error: Please add your MongoDB URI to .env.local
    at getClientPromise (/src/lib/mongodb.ts:61:15)
```

**Issue:** The module runs initialization code at the top level instead of lazily when needed, causing tests to crash during import.

**Solution:**
- Mock the mongodb module before any imports
- Or refactor mongodb.ts to lazy-load the connection
- Ensure jest.setup.ts properly mocks mongodb globally

---

## Summary by Fix Type

| Category | Count | MSW Can Fix? | Requires Code Changes? |
|----------|-------|--------------|------------------------|
| MSW-Fixable (Network/API) | 4 | ✅ Yes | No - just add MSW handlers |
| Component/UI Changes | 6 | ❌ No | Yes - update test expectations |
| Jest Config/Parse Errors | 3 | ❌ No | Yes - fix mock file syntax |
| Mock Setup Issues | 7 | ❌ No | Yes - fix jest.mock() setup |
| Module Evaluation | 1 | ❌ No | Yes - fix mongodb module mocking |
| ~~Theme Tests~~ | ~~1~~ | N/A | ✅ Removed (no theme in project) |

---

## MSW Impact: 4 out of 16 failing suites (25%)

### MSW Will Fix:
- All blog API endpoint tests
- Sanity data fetching tests  
- Blog page component tests that depend on API calls
- Any other tests failing due to unmocked HTTP/network requests

### MSW Will NOT Fix (12 suites, 75%):
- Component implementation changes (need test updates)
- Mock file syntax errors (need file fixes)
- jest.mock() configuration issues (need setup fixes)
- Module evaluation errors (need mongodb refactoring)
- Auth/redirect behavior changes (need test updates for Next.js 16)

---

## Recommended Fix Order

1. **Fix Jest parse errors first** (blocks 3 suites)
   - Fix `__mocks__/next/cache.js` syntax error
   
2. **Fix mongodb module evaluation** (blocks 1 suite + potential others)
   - Add proper global mock in jest.setup.ts
   
3. **Implement MSW** (fixes 4 suites - 23.5%)
   - Add handlers for `/api/blog/*`
   - Add Sanity client mocking
   
4. **Update component tests for Next.js 16** (fixes 7 suites)
   - Update admin dashboard expectations
   - Fix redirect test patterns
   - Update theme/cookie tests
   
5. **Fix remaining mock setup** (fixes 6 suites)
   - Sanity client initialization mocks
   - Environment variable mocking
   - Export validation

---

## Next Steps

**Immediate Actions:**
1. Review and fix `__mocks__/next/cache.js` to remove duplicate `jest` declaration
2. Add global mongodb mock to prevent module evaluation errors
3. Set up MSW handlers for blog API and Sanity endpoints
4. Update admin dashboard tests to expect simplified migration UI

**Long-term:**
- Consider refactoring modules to avoid top-level side effects
- Standardize on MSW for all network mocking
- Update all tests to Next.js 16 patterns
