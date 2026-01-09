# Cache Components Migration Plan — Home Page Optimization

Summary

-------

Convert the Home page to use Next.js Cache Components to mix static shell and cached dynamic data. Move client-side data fetching into server components or server helpers with `use cache` and `cacheTag`, define `cacheLife` profiles in `next.config.*`, and reduce reliance on Upstash/Redis where Next.js built-in cache suffices.

**Status:** ✅ **Phase 5 Complete** — DAL Pattern with PPR support implemented.

Architecture Overview (Updated)

-------

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Home Page (app/page.tsx)                    │
│                          'use cache' directive                      │
├─────────────────────────────────────────────────────────────────────┤
│                      PageLayoutServer (Server)                      │
│  ┌─────────────────────────────┬─────────────────────────────────┐ │
│  │      HeaderServer           │         FooterServer            │ │
│  │   (Static Navigation)       │     (Static Links/Info)         │ │
│  │  ┌──────────────────────┐   │   ┌─────────────────────────┐  │ │
│  │  │ UserAuthStatus       │   │   │ NewsletterForm          │  │ │
│  │  │ (Suspense + PPR)     │   │   │ (Client Island)         │  │ │
│  │  │ ┌──────────────────┐ │   │   └─────────────────────────┘  │ │
│  │  │ │HeaderAuthClient  │ │   │                                 │ │
│  │  │ │(Client Island)   │ │   │                                 │ │
│  │  │ └──────────────────┘ │   │                                 │ │
│  │  └──────────────────────┘   │                                 │ │
│  └─────────────────────────────┴─────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│                    Data Access Layer (DAL)                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ home.dal.ts (Public)          │ auth.dal.ts (Private)        │  │
│  │ - getFeaturedListings()       │ - getAuthStatus()            │  │
│  │ - getCities()                 │ - getUserDisplayInfo()       │  │
│  │ - getEcoTags()                │ - isUserAdmin()              │  │
│  │ 'use cache' + cacheLife('max')│ 'use cache: private'         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

Findings
--------

1. Home entry: `app-next-directory/app/page.tsx` (Home uses several client components: `HeroSection`, `FeaturedListings`, `CityCarousel`).
2. Data fetching: Home fetches via client calls to `/api/*` endpoints (e.g., `/api/featured-listings`, `/api/cities`). These APIs return `cache-control: no-store`.
3. Upstash/Redis usage: project contains Upstash helpers and calls (e.g., `lib/upstash`, `lib/cache`) used by some API routes and server helpers.
4. Large assets: Home references multiple large images served from Sanity CDN; these should be optimized (size, format, next/image) and lazy-loaded where appropriate.

Prioritized Fixes
-----------------

1) Enable Cache Components in `next.config.*`

- Add `cacheComponents: true` and a `cacheLife` profile for Home data (low risk).

Example (add to `next.config.ts`):

// next.config.ts
export default {
  experimental: {
    cacheComponents: true,
    cacheLife: {
      default: { revalidate: 3600 },      // 1 hour
      ecoTags: { revalidate: 86400 },     // 24 hours
      listings: { revalidate: 3600 }      // 1 hour
    }
  }
};

Effort: low. Verify: `pnpm build` and visit Home; no runtime errors.

1) Move data fetching into server helpers with `use cache` and `cacheTag`

- Create server helper `src/lib/featuredListings.ts` (Server Component helper) and mark `use cache` at top. Use `cacheTag('featured-listings')` when caching.

Snippet:

// src/lib/featuredListings.ts
'use server'
use cache
import { cacheTag } from 'next/cache'
import { client } from '@/sanity/lib/client'

export async function getFeaturedListings() {
  cacheTag('featured-listings')
  return client.fetch(/*GROQ*/ `*[_type == 'listing' && featured] | order(_createdAt desc)[0...10]`)
}

Effort: medium. Risk: medium (ensure server-only APIs). Verify: server-side render uses helper; LCP improve.

1) Replace client fetches to `/api/*` with server component data or use Server Actions/Route Handlers where necessary

- Update `app/page.tsx` to import server helper and pass data to client components as props. Wrap dynamic parts in `Suspense`.

Effort: medium. Verify: Network requests reduced on first paint; LCP reduced.

1) Introduce `cacheTag` + revalidation for writes/IMS

- For content update flows, call revalidation endpoints to `revalidateTag('featured-listings')` on content changes (e.g., webhook or admin updates).

Effort: medium. Verify: updating content invalidates cache and shows new content.

1) Audit and remove Upstash/Redis dependency where Next.js cache suffices

- Replace simple read-mostly caching (featured lists, homepage promos) with `use cache`/`cacheTag`. Keep Upstash for session-like or long-tail use cases only.

Effort: medium–high. Risk: medium (ensure session flows unaffected). Verify: functional parity + lower external calls.

1) Image & font optimizations

- Convert large banner images to Next `Image` with appropriate widths, serve AVIF/WebP, add `priority` for above-the-fold LCP images.

Effort: low–medium. Verify: image sizes reduced; LCP faster.

Verification & Measurement
------------------------

- Before/after: run performance trace (Chrome DevTools) and measure LCP, TTFB. Target: reduce render delay by >50%.
- CI: run `pnpm build` & `pnpm test` to ensure no regressions.

## Actionable To Do List (Detailed Status)

### Phase 1: Configuration

- [x] Enable `cacheComponents` in `next.config.ts` (Confirmed enabled in project)

### Phase 2: Server-Side Migration (Home Page)

- [x] Create/Update server helpers in `src/lib/sanity/queries.ts`
- [x] Refactor `FeaturedListings` component to accept `initialListings` prop (Hybrid Pattern)
- [x] Refactor `CityCarousel` component to accept `initialCities` prop (Hybrid Pattern)
- [x] Update `app/page.tsx` to fetch data server-side and pass to components
- [x] Implement `Suspense` boundaries for async data fetching in `app/page.tsx`

### Phase 3: Optimization & Stabilization

- [x] **CRITICAL:** Fix prerender timeouts for `/api/featured-listings` (currently taking >10s during build)
  - Applied `unstable_cache` from Next.js to `getFeaturedListings`, `getAllCities`, and `getAllEcoTags`
  - Cache TTL: 1 hour for listings/cities, 24 hours for eco tags
- [x] **CRITICAL:** Fix cache read errors for `static:eco-tags` and `static:amenities`
  - Updated `cache-strategy.ts` to skip Redis entirely during build time
  - Added `isBuildTime()` check that respects `NEXT_BUILD_MODE` and `DISABLE_UPSTASH_DURING_BUILD` env vars
- [x] Apply `use cache` and `cacheTag` to server queries in `src/lib/sanity/queries.ts`
  - Used `unstable_cache` with cache tags for on-demand revalidation
- [x] Verify build with `next build --debug-prerender`

### Phase 4: Cleanup & Further Optimization

- [ ] Add revalidation endpoints to call `revalidateTag` on content updates
- [ ] Audit Upstash usage and migrate read-mostly caches to Next.js cache
- [ ] Optimize Home images to use `next/image` with modern formats

### Phase 5: DAL Pattern & PPR Implementation ✅ COMPLETE

- [x] **Create Data Access Layer (DAL) for Home page**
  - Created `src/lib/data-access/home.dal.ts` with `use cache` + `cacheLife('max')`
  - Functions: `getFeaturedListings()`, `getCities()`, `getEcoTags()`, `getHomePageData()`
  - Tags: `featured-listings`, `cities`, `home`
- [x] **Create Auth DAL with `use cache: private`**
  - Created `src/lib/data-access/auth.dal.ts` for per-user cached auth data
  - Functions: `getAuthStatus()`, `getUserDisplayInfo()`, `isUserAdmin()`, `getCurrentUserId()`
  - Uses `use cache: private` for user-specific caching
- [x] **Refactor Header for PPR**
  - Created `HeaderServer.tsx` (server component with static navigation)
  - Created `UserAuthStatus.tsx` (Suspense wrapper for auth UI)
  - Created `HeaderAuthClient.tsx` (client island for auth dropdown)
- [x] **Refactor Footer for PPR**
  - Created `FooterServer.tsx` (server component with static links)
  - Created `NewsletterForm.tsx` (client island for newsletter subscription)
- [x] **Update Home page to use DAL**
  - Updated `app/page.tsx` to use `PageLayoutServer`
  - Replaced inline queries with DAL functions
  - Simplified data fetching with proper caching

#### New Files Created (Phase 5)

| File | Purpose |
| ---- | ------- |
| `src/lib/data-access/home.dal.ts` | Home page public data with `use cache` |
| `src/lib/data-access/auth.dal.ts` | User auth data with `use cache: private` |
| `src/components/layout/HeaderServer.tsx` | Server-rendered header shell |
| `src/components/layout/HeaderAuthClient.tsx` | Client island for auth dropdown |
| `src/components/layout/UserAuthStatus.tsx` | Suspense wrapper for auth UI |
| `src/components/layout/FooterServer.tsx` | Server-rendered footer shell |
| `src/components/layout/NewsletterForm.tsx` | Client island for newsletter form |
| `src/components/layout/PageLayoutServer.tsx` | Server layout with PPR support |

## Handoff Notes for Next Session

**Last Updated:** 2026-01-09

### Quick Context

This migration converts the Home page to use Next.js Cache Components for better performance. Phases 1-5 are complete, with Phase 5 implementing the DAL Pattern with PPR support. Migration includes server-side data fetching, Suspense boundaries, optimized caching strategies, and PPR-enabled components for improved performance and user experience.

### Key Files Modified

| File | Purpose |
|------|---------|
| `src/lib/sanity/queries.ts` | Server queries now wrapped with `unstable_cache` |
| `src/lib/cache-strategy.ts` | Redis bypassed during build via `isBuildTime()` |
| `app/page.tsx` | Server Component fetching data with Suspense |
| `next.config.ts` | `cacheComponents: true` already enabled |
| `src/lib/data-access/home.dal.ts` | Home page public data with `use cache` |
| `src/lib/data-access/auth.dal.ts` | User auth data with `use cache: private` |
| `src/components/layout/HeaderServer.tsx` | Server-rendered header shell |
| `src/components/layout/HeaderAuthClient.tsx` | Client island for auth dropdown |
| `src/components/layout/UserAuthStatus.tsx` | Suspense wrapper for auth UI |
| `src/components/layout/FooterServer.tsx` | Server-rendered footer shell |
| `src/components/layout/NewsletterForm.tsx` | Client island for newsletter form |
| `src/components/layout/PageLayoutServer.tsx` | Server layout with PPR support |

### What Was Done (Phase 3)

1. **Added `unstable_cache` wrappers** to `src/lib/sanity/queries.ts`:

   ```ts
   // Featured listings: 1hr cache, tag: 'featured-listings'
   const getCachedFeaturedListings = unstable_cache(async (limit) => {...}, ['featured-listings'], { revalidate: 3600, tags: ['featured-listings'] });
   
   // Cities: 1hr cache, tag: 'cities'
   const getCachedAllCities = unstable_cache(async () => {...}, ['all-cities'], { revalidate: 3600, tags: ['cities'] });
   
   // Eco tags: 24hr cache, tag: 'eco-tags'  
   const getCachedEcoTags = unstable_cache(async () => {...}, ['eco-tags'], { revalidate: 86400, tags: ['eco-tags'] });
   ```

2. **Fixed build-time Redis errors** in `src/lib/cache-strategy.ts`:

   ```ts
   const isBuildTime = () =>
     process.env.NEXT_BUILD_MODE === 'true' ||
     process.env.DISABLE_UPSTASH_DURING_BUILD === '1';
   
   // Early return in cachedQuery() to skip Redis during build
   if (isBuildTime()) {
     updateMetrics(fullKey, 'miss');
     return queryFn();
   }
   ```

### Resolved Issues

| Issue | Solution |
|-------|----------|
| Build timeout (>10s) for featured listings | `unstable_cache` persists results between builds |
| Cache read errors for `static:eco-tags` | Redis bypassed during build |

### Remaining Tasks (Phase 4)

1. **Add revalidation endpoint** - Create `app/api/revalidate/route.ts`:

   ```ts
   import { revalidateTag } from 'next/cache';
   const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

   export async function POST(request: Request) {
   // Verify secret
   const authHeader = request.headers.get('authorization');
   if (!authHeader || !REVALIDATE_SECRET || authHeader !== `Bearer ${REVALIDATE_SECRET}`) {
     return Response.json({ error: 'Unauthorized' }, { status: 401 });
   }
    
     const { tag } = await request.json();
   // Validate tag
   const validTags = ['featured-listings', 'cities', 'eco-tags'];
   if (!tag || !validTags.includes(tag)) {
     return Response.json({ error: 'Invalid tag' }, { status: 400 });
   }

     revalidateTag(tag); // 'featured-listings', 'cities', 'eco-tags'
     return Response.json({ revalidated: true });
   }
   ```

2. **Wire up Sanity webhooks** - Call revalidation endpoint when content changes

3. **Audit Upstash usage** - Search for remaining `getRedisClient()` calls and migrate read-mostly operations to `unstable_cache`

4. **Optimize images** - Add `priority` prop to above-fold images, ensure `next/image` is used

### Verification Commands

```bash
# Verify build succeeds without timeouts
cd app-next-directory && pnpm build

# Check types (pre-existing mock errors are known issues)
pnpm check-types

# Run dev server to test
pnpm dev:next
```

### Environment Variables for Build

The following environment variables are used to optimize build performance and prevent timeouts during static generation. They should be set during CI/CD builds but not in local development or production deployments.

#### `NEXT_BUILD_MODE=true`

- **When to set**: CI/CD builds only (not local dev or production)
- **Modules/files that read it**:
  - `src/lib/cache-strategy.ts`: Used in `isBuildTime()` function to detect build context
- **Rationale**: Signals build-time context to prevent Redis connections during prerendering, avoiding connection timeouts and build failures
- **Example usage**:
  - Local dev: Not set (Redis connections allowed)
  - CI/CD: `NEXT_BUILD_MODE=true pnpm build`

#### `DISABLE_UPSTASH_DURING_BUILD=1`

- **When to set**: CI/CD builds only (not local dev or production)
- **Modules/files that read it**:
  - `src/lib/cache-strategy.ts`: Part of `isBuildTime()` check
  - `src/lib/redis.ts`: Skips Redis client creation
  - `src/utils/rate-limit.ts`: Bypasses rate limiting logic
- **Rationale**: Prevents Redis connection attempts during build/prerender to avoid network timeouts and connection pool issues
- **Example usage**:
  - Local dev: Not set (Redis connections allowed)
  - CI/CD: `DISABLE_UPSTASH_DURING_BUILD=1 pnpm build`

#### `DISABLE_SANITY_DURING_BUILD=1`

- **When to set**: CI/CD builds only (not local dev or production)
- **Modules/files that read it**:
  - `src/lib/sanity/client.ts`: Skips Sanity client initialization
  - `src/lib/sanity-http-client.ts`: Returns fixture data instead of making API calls
  - `src/lib/auth/userService.ts`: Bypasses Sanity queries for user data
- **Rationale**: Prevents network calls to Sanity CMS during build/prerender, avoiding API timeouts and ensuring build succeeds without external dependencies
- **Example usage**:
  - Local dev: Not set (real Sanity data used)
  - CI/CD: `DISABLE_SANITY_DURING_BUILD=1 pnpm build`
