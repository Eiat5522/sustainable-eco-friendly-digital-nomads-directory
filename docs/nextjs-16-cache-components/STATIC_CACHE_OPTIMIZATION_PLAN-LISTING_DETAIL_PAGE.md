# Objective: Implement Static Cache Optimization for Listing Detail Pages (`/listings/[slug]`)

This plan captures the updated implementation approach used in the codebase: a small Data Access Layer (DAL) for public vs. user-specific data, Next.js 16 caching primitives, and Partial Prerendering (PPR) patterns for a fast static shell with safe per-user behavior.

## Step 1: Clean Up Legacy Configurations

- **Action:** Remove `export const revalidate = ...` and `export const dynamic = ...` from `page.tsx`.
- **Rationale:** Use `'use cache'` and `cacheLife` instead, which provide finer control and tag-based invalidation.

## Step 2: Pre-generate Popular Listings via `generateStaticParams` (use Listings DAL)

- **Implementation:** Use the Listings DAL (e.g., `getPopularListingSlugs()` in `src/lib/data-access/listings.dal.ts`) in `generateStaticParams` to pre-build popular listings.
- **Fallback:** Paths not prebuilt are generated on first request and then cached.

## Step 3: Centralize Data Access in a DAL and Apply Cache Directives

- **Listings DAL (public):** Move listing/detail/related fetches into `listings.dal.ts`. Use `'use cache'`, `cacheLife('max')` for long-lived public caching and `cacheTag(`listing-${slug}`)` for targeted revalidation.
- **Favorites DAL (user-specific):** Create `favorites.dal.ts` with functions like `checkIsFavorited()` and `getListingReviews()`; use `'use cache: private'` for functions that require `cookies()` or headers and should be cached per-user for a short window.
- **Best practice:** DAL functions should be small, typed, and return safe fallbacks (null/empty arrays) when a fetch fails during build/prerender.

## Step 4: Use PPR with `<Suspense>` for Dynamic or Slow Subtrees

- **Action:** Wrap dynamic secondary sections in `<Suspense>` to allow the static shell to render immediately while the dynamic part streams in.
- **Example:** Recommended venues, heavy maps, and third-party widgets.

## Step 5: Serve Interactive User State via a Suspense-wrapped Server Component (private caching)

- **Pattern:** Use a small **server** component `UserFavoriteStatus` that calls `checkIsFavorited(listingId, userId)` from `favorites.dal.ts`.
  - `checkIsFavorited` should declare `'use cache: private'`, call `cookies()` (or `auth()`), set `cacheLife({ stale: 60 })`, and use `cacheTag(`user-${userId}-favorite-${listingId}`)`.
  - Wrap `UserFavoriteStatus` in `<Suspense>` and render the client `FavoriteButton` with `initialIsFavorited` passed in.
- **Client interactions:** `FavoriteButton` is `use client` and performs the mutation via API route; server-side logic should invalidate the per-user favorite tags after a toggle.

## Step 6: On-Demand Revalidation & Tag Strategy

- **CMS edits:** Call `revalidateTag(`listing-${slug}`)` from the CMS webhook to refresh listing content.
- **Review publishes:** Call `updateTag('reviews')` or `revalidateTag('reviews')` so the reviews section is refreshed.
- **Favorites toggles:** Invalidate per-user favorite tags `user-${userId}-favorite-${listingId}` upon toggle to avoid stale per-user cache.

## Cache Strategy Summary

| Data Type | Directive | Location | Duration |
| --- | --- | --- | --- |
| Listing details | `use cache` | Server + CDN | max (long) |
| Related listings | `use cache` | Server + CDN | max (long) |
| Reviews | `use cache` | Server + CDN | 5 minutes |
| User favorites (initial state) | `use cache: private` | Browser-only per-user cache | ~60 seconds |

## Implementation Checklist

- [x] Create `src/lib/data-access/` and follow DAL pattern
- [x] Implement `listings.dal.ts` with `getListingBySlug()`, `getRelatedListings()`, `getPopularListingSlugs()` using `use cache` + `cacheTag`
- [x] Implement `favorites.dal.ts` with `checkIsFavorited()` (using `use cache: private`) and `getListingReviews()`
- [x] Add `UserFavoriteStatus` server component wrapped in `<Suspense>` and a `FavoriteButton` client component that accepts `initialIsFavorited`
- [x] Update `app/listings/[slug]/page.tsx` to call DAL functions and render `UserFavoriteStatus` in the interactive area
- [x] Add webhook handler that calls `revalidateTag('listing-{slug}')` on listing edits and `updateTag('reviews')` on review state changes
- [ ] Add unit/integration tests for DAL and cache invalidation flows

## Example (simplified)

Listing page (server):

```tsx
import { cacheTag, cacheLife } from 'next/cache';
import { Suspense } from 'react';
import { getListingBySlug } from '@/lib/data-access/listings.dal';
import UserFavoriteStatus from '@/components/favorites/UserFavoriteStatus';

export default async function ListingPage({ params: { slug } }) {
  'use cache';
  cacheLife('max');
  cacheTag(`listing-${slug}`);

  const listing = await getListingBySlug(slug);

  return (
    <div>
      <h1>{listing.name}</h1>
      <section>
        <Suspense fallback={<span>Loading...</span>}>
          <UserFavoriteStatus listingId={listing.id} slug={listing.slug} />
        </Suspense>
      </section>
    </div>
  );
}
```

Favorites DAL (key points):

```ts
export async function checkIsFavorited(listingId: string, userId?: string) {
  'use cache: private';
  cacheLife({ stale: 60 });
  cacheTag(`user-${userId}-favorite-${listingId}`);
  // call cookies()/auth() and return boolean
}
```

---

If you'd like, I can open a PR with this updated plan and add the checklist items as issues. Let me know and I'll prepare the branch and PR.
