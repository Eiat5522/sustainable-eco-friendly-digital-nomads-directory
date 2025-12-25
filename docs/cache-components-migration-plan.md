## Cache Components Migration Plan — Home Page Optimization

Summary
-------

Convert the Home page to use Next.js Cache Components to mix static shell and cached dynamic data. Move client-side data fetching into server components or server helpers with `use cache` and `cacheTag`, define `cacheLife` profiles in `next.config.*`, and reduce reliance on Upstash/Redis where Next.js built-in cache suffices.

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

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    hours: { stale: 60 * 60, revalidate: 60 * 10, expire: 60 * 60 * 24 },
  },
}

export default nextConfig
```

Effort: low. Verify: `pnpm build` and visit Home; no runtime errors.

1) Move data fetching into server helpers with `use cache` and `cacheTag`

- Create server helper `src/lib/featuredListings.ts` (Server Component helper) and mark `use cache` at top. Use `cacheTag('featured-listings')` when caching.

Snippet:

```ts
// src/lib/featuredListings.ts
'use server'
use cache
import { client } from '@/sanity/lib/client'

export async function getFeaturedListings() {
  cacheTag('featured-listings')
  return client.fetch(/* GROQ */ `*[_type == 'listing' && featured] | order(_createdAt desc)[0...10]`)
}
```

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

### Phase 3: Optimization & Stabilization (Current Focus)

- [ ] **CRITICAL:** Fix prerender timeouts for `/api/featured-listings` (currently taking >10s during build)
- [ ] **CRITICAL:** Fix cache read errors for `static:eco-tags` and `static:amenities`
- [ ] Apply `use cache` and `cacheTag` to server queries in `src/lib/sanity/queries.ts`
- [ ] Verify build with `next build --debug-prerender`

### Phase 4: Cleanup & Further Optimization

- [ ] Add revalidation endpoints to call `revalidateTag` on content updates
- [ ] Audit Upstash usage and migrate read-mostly caches to Next.js cache
- [ ] Optimize Home images to use `next/image` with modern formats

## Handoff Notes for Next Session

**Current State:**

The Home page (`app/page.tsx`) has been successfully converted to a Server Component. It now fetches data for `FeaturedListings` and `CityCarousel` on the server and passes it down as initial props. This eliminates client-side waterfalls and prepares the app for Cache Components.

**Known Issues:**

1. **Build Timeouts:** The `next build --debug-prerender` command is hitting timeouts.
   - *Symptom:* Logs show "Featured listings fetch timed out or failed; using fallback" taking 4s-10s.
   - *Cause:* The server-side data fetching (or the fallback API call) is too slow for the prerender timeout limits.
2. **Cache Errors:** Logs show `[Error] Cache read failed... static:eco-tags`.

**Immediate Next Steps:**

1. **Optimize Queries:** The server queries in `src/lib/sanity/queries.ts` likely need `use cache` directives to persist results and avoid hitting Sanity/DB repeatedly during build/prerender.
2. **Debug API:** Investigate `/api/featured-listings` to see why it's slow. It might be doing unnecessary work that can be cached.
3. **Verify Build:** Once caching is applied, run `next build --debug-prerender` again to confirm the timeouts are resolved.



- I will not run codemods or change runtime behavior until you confirm. Next step: run the automated migration to enable Cache Components and attempt fixes (`mcp_next-devtools_enable_cache_components`) or proceed file-by-file.
