# Console Errors Classification

**Document Purpose:** This document classifies console errors discovered during development server testing, build processes, and linting into priority categories to help plan fixes accordingly.

**Generated:** 2025-11-03

**Classification Categories:**
- **Critical** - Must fix now (Application-breaking, security issues, data loss risks)
- **High** - Important but app partially functional (Major features broken, poor UX)
- **Medium** - Should fix soon (Degraded functionality, best practices)
- **Low** - Can fix when have time (Cosmetic issues, optimization opportunities)

---

## Critical Priority Errors (Must Fix Now)

### 1. MongoDB Configuration Missing
**Error Type:** Runtime / Configuration  
**Location:** Server-side authentication  
**Error Message:**
```
Error: Please add your MongoDB URI to .env.development
at eval (src/lib/mongodb.ts:40:11)
```

**Impact:**
- Authentication system completely broken
- Cannot sign in or register users
- Session management fails
- Blocks all authenticated features

**Affected Areas:**
- `/api/auth/session` (HTTP 500)
- `/api/auth/[...nextauth]` 
- All pages requiring authentication

**Recommendation:** Set up MongoDB connection string in `.env.development` file immediately.

---

### 2. Sanity CMS Configuration Missing
**Error Type:** Runtime / Configuration  
**Location:** Multiple API routes  
**Error Messages:**
```
[ERROR] Featured Listings API: Sanity environment variables are not configured.
Error: Configuration must contain `projectId`
at eval (src/lib/sanity.js:12:35)
```

**Impact:**
- Featured listings cannot load
- Cities data unavailable
- Amenities endpoint fails
- Blog posts cannot be fetched
- Core content delivery broken

**Affected Areas:**
- `/api/featured-listings` (HTTP 500)
- `/api/cities` (HTTP 500)
- `/api/amenities` (HTTP 500)
- `/blog` page errors
- Home page missing content

**Recommendation:** Configure Sanity `projectId`, `dataset`, and `apiVersion` in environment variables.

---

### 3. TypeScript Build Failures - Missing Dependencies
**Error Type:** Build / Type Checking  
**Location:** Multiple source files  
**Error Messages:**
```
error TS2307: Cannot find module 'react' or its corresponding type declarations.
error TS2307: Cannot find module 'next' or its corresponding type declarations.
error TS2307: Cannot find module 'sanity' or its corresponding type declarations.
```

**Impact:**
- Build process fails completely
- Cannot generate production build
- Type safety compromised
- Development experience degraded
- CI/CD pipeline blocked

**Affected Files:**
- 200+ TypeScript errors across all components
- Core dependencies: react, next, sanity, next-auth
- Type definitions missing for essential packages

**Recommendation:** Run `pnpm install` in workspace directories to ensure all dependencies and type definitions are properly installed.

---

## High Priority Errors

### 4. Authentication Session Parsing Error
**Error Type:** Runtime / Client-side  
**Location:** Browser console  
**Error Message:**
```
ClientFetchError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON.
at fetchData (next-auth/lib/client.js:50:22)
```

**Impact:**
- Session state cannot be determined
- User authentication status unknown
- Protected routes may fail
- Login/logout functionality impaired

**Affected Components:**
- `SessionProvider` component
- All components using `useSession()` hook
- Authentication flow

**Root Cause:** Server returning HTML error page instead of JSON due to MongoDB connection failure.

**Recommendation:** Fix after resolving Critical Error #1 (MongoDB configuration).

---

### 5. Google Fonts Loading Failure
**Error Type:** Network / External Resource  
**Location:** Server-side rendering  
**Error Messages:**
```
getaddrinfo ENOTFOUND fonts.googleapis.com
Retrying 1/3...
⨯ Failed to download `Inter` from Google Fonts. Using fallback font instead.
```

**Impact:**
- Typography degraded to fallback font
- Brand consistency affected
- Page load time may increase
- User experience slightly degraded

**Affected Areas:**
- All pages using Inter font
- Global typography

**Recommendation:** Either configure network access to Google Fonts or use self-hosted fonts for offline development.

---

### 6. Blog Post Fetch Failures
**Error Type:** Runtime / API  
**Location:** Blog page  
**Error Messages:**
```
Error: Failed to fetch posts: 503 Service Unavailable
App segment error caught: Error: Failed to fetch posts: 503 Service Unavailable
```

**Impact:**
- Blog page completely broken
- Shows error boundary
- No blog content accessible
- SEO impact for blog articles

**Affected Areas:**
- `/blog` page
- Blog listing component
- Individual blog posts

**Root Cause:** Sanity CMS not configured (see Critical Error #2).

**Recommendation:** Fix after resolving Sanity configuration.

---

### 7. Network Error - Sanity API Connection
**Error Type:** Network / API  
**Location:** Categories API  
**Error Message:**
```
Categories API error: [TypeError: fetch failed]
getaddrinfo ENOTFOUND projectid.api.sanity.io
```

**Impact:**
- Category filtering unavailable
- Search functionality degraded
- Listing categorization broken

**Affected Areas:**
- `/api/categories`
- Search filters
- Category navigation

**Root Cause:** Invalid Sanity project ID in configuration.

**Recommendation:** Configure correct Sanity project ID.

---

## Medium Priority Errors

### 8. Next.js Workspace Root Warning
**Error Type:** Configuration / Build Warning  
**Location:** Next.js build process  
**Error Message:**
```
⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
We detected multiple lockfiles and selected the directory of /home/runner/.../pnpm-lock.yaml
Detected additional lockfiles: * .../app-next-directory/package-lock.json
```

**Impact:**
- Build configuration ambiguity
- Potential deployment issues
- File tracing may be incorrect

**Status:** Completed  
**Root Cause:** Multiple lockfiles in the monorepo cause Next.js to mis-detect the workspace root, leading to incorrect file tracing and bundle resolution.  
**Resolution Steps:**
1. Remove stale lockfiles (`package-lock.json`) that are not used with pnpm while keeping `pnpm-lock.yaml` authoritative. ✅
2. Set `outputFileTracingRoot` explicitly in `app-next-directory/next.config.js` to `/home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory`.
3. Document the lockfile policy in `docs/development/README.md` to prevent future drift.

**Verification:**
- `pnpm build:next` completes without emitting the workspace warning.
- Incremental deploy preview shows no missing assets.
- `pnpm lint` runs without path resolution errors.

---

### 9. Featured Listings Component Error
**Error Type:** Runtime / Client-side  
**Location:** Home page  
**Error Message:**
```
[ERROR] [FeaturedListings] failed to load listings 
Error: Failed to load featured listings. Please try again later.
```

**Impact:**
- Home page missing featured content
- First impression degraded
- Call-to-action weakened

**Affected Components:**
- `FeaturedListings` component
- Home page hero section

**Root Cause:** Sanity API not configured (see Critical Error #2).

**Status:** Needs Verification  
**Resolution Steps:**
1. Confirm Sanity credentials from Phase 1 are loaded by checking `pnpm dev:next` logs for successful dataset connection.
2. Add defensive loading and empty-state handling inside `app-next-directory/src/components/home/FeaturedListings.tsx`.
3. Write a Jest test that mocks the listings API response to ensure graceful handling of `undefined` or empty arrays.

**Verification:**
- Visiting `/` renders featured listings without console errors.
- Network tab shows a successful `/api/featured-listings` response (HTTP 200).
- Jest suite covering `FeaturedListings` passes locally (`pnpm test:unit -- Home/FeaturedListings`).

---

### 10. TypeScript Implicit Any Types
**Error Type:** Type Safety  
**Location:** Multiple components  
**Error Examples:**
```
error TS7006: Parameter 'e' implicitly has an 'any' type.
error TS7006: Parameter 'prev' implicitly has an 'any' type.
error TS7006: Parameter 'review' implicitly has an 'any' type.
```

**Impact:**
- Type safety compromised
- Potential runtime errors
- Harder to maintain code
- IDE autocomplete degraded

**Affected Files:**
- `CommentForm.tsx`
- `Footer.tsx`
- `GalleryGrid.tsx`
- `ReviewsSection.tsx`
- `ProfileEditForm.tsx`
- ~20 other files

**Status:** In Progress  
**Breakdown:** UI form handlers (9 files), data transformation utilities (6 files), API route handlers (5 files).  
**Resolution Steps:**
1. Generate an inventory of offending symbols via `pnpm lint --filter @app-next-directory --rule @typescript-eslint/no-implicit-any`.
2. Prioritise shared utilities (`src/lib`, `src/utils`) so downstream components inherit the improved typing.
3. Add regression unit tests where type tightening changes runtime behaviour (e.g., stricter enums).

**Verification:**
- `pnpm check-types` exits cleanly.
- ESLint report shows zero `no-implicit-any` violations.
- No new TypeScript suppression comments (`// @ts-ignore`) introduced.

---

### 11. Missing process.env Type Definitions
**Error Type:** Type Safety  
**Location:** Multiple files  
**Error Message:**
```
error TS2580: Cannot find name 'process'. 
Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
```

**Impact:**
- TypeScript errors in environment variable access
- Build may fail with strict type checking
- Development experience affected

**Affected Files:**
- `db-helpers.ts`
- `MswInit.tsx`
- `SocialAuthRow.tsx`
- `Header.tsx`
- `ListingDetailView.tsx`

**Status:** Blocked (Needs Decision)  
**Root Cause:** `app-next-directory/tsconfig.json` excludes the Node types while the runtime accesses `process.env`.  
**Resolution Options:**
1. Install `@types/node` into the root workspace (`pnpm add -D @types/node --filter app-next-directory`).
2. Alternatively, encapsulate environment access behind a typed helper (`src/lib/env.ts`) and import types locally.
3. Update TypeScript configuration to include `"types": ["node", "jest"]` where appropriate.

**Verification:**
- `pnpm check-types` finds no `TS2580` errors.
- Generated env helper exposes typed accessors consumed by affected files.
- CI passes with no unexpected ambient type leaks.

---

### 12. Playwright Installation Error
**Error Type:** Development Tool  
**Location:** Post-install script  
**Error Message:**
```
RangeError: Invalid count value: Infinity
at String.repeat (<anonymous>)
at ChildProcess.<anonymous> (playwright-core/lib/server/registry/browserFetcher.js:163:32)
```

**Impact:**
- E2E tests cannot run
- Browser automation unavailable
- CI/CD testing pipeline affected

**Status:** Blocked (CI pipeline)  
**Root Cause:** GitHub Actions runners still execute the older Playwright post-install flow, triggering a known bug when calculating browser download progress in constrained environments. Local installs succeed after the upgrade.  
**Resolution Steps:**
1. Bump Playwright to the latest minor release (`pnpm up @playwright/test playwright-core`). ✅ (local)
2. Run `pnpm exec playwright install --with-deps` during CI with retry logic or cached browsers.
3. Add a post-install guard script so CI skips redundant downloads when cache is present and ensure the workflow uses the upgraded CLI.

**Verification:**
- `pnpm test:e2e --list` enumerates available projects with no installation errors locally.
- GitHub Actions logs show completed browser installation without `RangeError`.
- A smoke E2E run (`pnpm test:e2e --project=chromium --grep @smoke`) passes in CI.

---

## Low Priority Issues (Can Fix When Have Time)

### 13. ESLint Warnings - Unused Variables
**Error Type:** Code Quality / Linting  
**Location:** Multiple API routes and components  
**Examples:**
```
warning 'error' is defined but never used. Allowed unused caught errors must match /^_/u
warning 'fetchFn' is assigned a value but never used.
warning 'transform' is assigned a value but never used.
```

**Impact:**
- Minor code quality issue
- Slightly larger bundle size
- Code maintenance overhead

**Affected Files:**
- `/api/amenities/route.ts`
- `/api/cities/route.ts`
- `/api/digital-nomad-features/route.ts`
- `/api/eco-tags/route.ts`
- `/api/blog/route.ts`
- 15+ other files

**Recommendation:** 
- Rename unused catch variables to `_error`
- Remove unused variable declarations
- Or suppress specific warnings if intentional

---

### 14. ESLint Warnings - Explicit Any Types
**Error Type:** Code Quality / Type Safety  
**Location:** Multiple files  
**Examples:**
```
warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any
```

**Impact:**
- Reduced type safety
- Potential for runtime errors
- Harder to refactor safely

**Affected Files:**
- `/api/auth/update-profile/route.ts`
- `/api/blog/[slug]/route.ts`
- `/api/comments/route.ts`
- `/api/listings/route.ts`
- `db-helpers.ts` (40+ instances)
- 20+ other files

**Total Instances:** ~100+ warnings

**Recommendation:** Replace `any` types with proper type definitions, unions, or generics.

---

### 15. ESLint Warnings - React Hooks Dependencies
**Error Type:** React Best Practices  
**Location:** Component files  
**Example:**
```
warning React Hook useEffect has a missing dependency: 'loadUsers'. 
Either include it or remove the dependency array react-hooks/exhaustive-deps
```

**Impact:**
- Potential stale closures
- Components may not re-render correctly
- Subtle bugs in state management

**Affected Files:**
- `app/admin/users/UserManagementTable.tsx`
- Potentially other components

**Recommendation:** Review and add missing dependencies or use `useCallback` for stable function references.

---

### 16. ESLint Warnings - Forbidden require() Imports
**Error Type:** Code Style / Best Practices  
**Location:** `db-helpers.ts`  
**Example:**
```
warning A `require()` style import is forbidden @typescript-eslint/no-require-imports
```

**Impact:**
- Inconsistent import style
- May affect tree-shaking
- Code style violation

**Instances:** ~10 occurrences in `db-helpers.ts`

**Recommendation:** Convert `require()` to ES6 `import` statements.

---

### 17. Next.js Telemetry Notice
**Error Type:** Informational  
**Location:** Development server  
**Message:**
```
Attention: Next.js now collects completely anonymous telemetry regarding usage.
You can learn more, including how to opt-out at: https://nextjs.org/telemetry
```

**Impact:**
- None (informational only)
- Anonymous data collection

**Recommendation:** 
- Optionally disable with `NEXT_TELEMETRY_DISABLED=1` environment variable
- Or ignore if telemetry is acceptable

---

### 18. React DevTools Console Message
**Error Type:** Informational  
**Location:** Browser console  
**Message:**
```
%cDownload the React DevTools for a better development experience: 
https://react.dev/link/react-devtools
```

**Impact:**
- None (development tool suggestion)

**Recommendation:** Install React DevTools browser extension for better development experience (optional).

---

### 19. Next.js Dev Tools Overlay Visible
**Error Type:** UI / Development  
**Location:** Browser page overlay  
**Visible Element:**
```
button "Open issues overlay"
button "Collapse issues badge"
Issue count badge
```

**Impact:**
- Development UI visible in browser
- May be confusing for non-developers

**Recommendation:** 
- Normal for development mode
- Will not appear in production build
- Can be dismissed in browser

---

### 20. 404 Not Found Warnings
**Error Type:** Runtime / Client-side  
**Location:** Browser console  
**Message:**
```
Failed to load resource: the server responded with a status of 404 (Not Found)
```

**Context:** Appears on `/auth/login` page

**Impact:**
- Minor - likely missing static assets or API routes
- May be expected for certain routes

**Recommendation:** Investigate specific 404 URLs and determine if they're expected or need fixing.

---

## Summary Statistics

| Priority | Count | Percentage |
|----------|-------|------------|
| Critical | 3 | 15% |
| High | 4 | 20% |
| Medium | 5 | 25% |
| Low | 8 | 40% |
| **Total** | **20** | **100%** |

---

## Recommended Fix Order

### Phase 1: Immediate (Critical)
1. Configure MongoDB URI in `.env.development`
2. Configure Sanity CMS credentials (projectId, dataset, apiVersion)
3. Run `pnpm install` to fix TypeScript build errors

**Estimated Time:** 30-60 minutes  
**Impact:** Restores core application functionality

### Phase 2: Important (High Priority)
4. Fix authentication session parsing (should resolve after Phase 1)
5. Configure Google Fonts access or use self-hosted fonts
6. Verify blog fetch works after Sanity configuration
7. Fix network errors to Sanity API

**Estimated Time:** 1-2 hours  
**Impact:** Restores all major features

### Phase 3: Quality Improvements (Medium Priority)
8. Configure Next.js workspace root properly
9. Fix TypeScript implicit any types (~20 files)
10. Add @types/node for process.env types
11. Fix Playwright installation
12. Address featured listings component

**Estimated Time:** 3-4 hours  
**Impact:** Improves code quality and development experience

### Phase 4: Polish (Low Priority)
13. Clean up unused variables (~20 files)
14. Replace explicit any types (~100 instances)
15. Fix React hooks dependencies
16. Convert require() to import statements
17. Handle informational messages

**Estimated Time:** 6-8 hours  
**Impact:** Code quality, maintainability, best practices

---

## Environment Configuration Checklist

Create or update `.env.development` and `.env.local` files with:

```bash
# MongoDB Configuration (Critical)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# Sanity CMS Configuration (Critical)
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-api-token
SANITY_API_VERSION=2024-01-01

# NextAuth Configuration (High Priority)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Optional: Disable Next.js Telemetry (Low Priority)
NEXT_TELEMETRY_DISABLED=1

# Next.js Configuration
NODE_ENV=development
```

---

## Additional Notes

### Network Connectivity
Several errors are related to external service connectivity:
- Google Fonts API (fonts.googleapis.com)
- Sanity CDN (projectid.api.sanity.io)

These may require network access or proper credentials to resolve.

### Development vs Production
Some errors are development-mode specific:
- React DevTools messages
- Next.js Dev Tools overlay
- Telemetry notices
- Hot Module Replacement (HMR) logs

These will not appear in production builds.

### TypeScript Configuration
The high number of TypeScript errors suggests that:
1. Dependencies may not be fully installed in workspaces
2. Type definitions may be missing
3. `tsconfig.json` may need adjustment

Consider running:
```bash
pnpm install --recursive
pnpm --filter app-next-directory install
```

---

## Monitoring & Validation

After fixes are applied, validate by:

1. **Build Test:** `pnpm build` should complete without errors
2. **Type Check:** `pnpm check-types` should pass
3. **Lint Check:** `pnpm lint` should show minimal warnings
4. **Dev Server:** `pnpm dev` should start without errors
5. **Browser Console:** Should show no critical errors
6. **Feature Testing:**
   - [ ] Home page loads with featured listings
   - [ ] Search page works with filters
   - [ ] Blog page displays posts
   - [ ] Authentication flow works
   - [ ] Contact form submits successfully

---

**End of Classification Report**
