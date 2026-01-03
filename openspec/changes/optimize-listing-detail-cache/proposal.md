# Change: Optimize listing detail page caching and client boundaries

## Why
The listing detail route should serve a static, cacheable shell with predictable streaming for client
islands so it loads faster and keeps user-specific interactivity isolated. Current components mark
large sections as client and may not fully leverage Next.js 16 cache directives or tag-based
revalidation for reviews/favorites.

## What Changes
- Apply `use cache` with `cacheLife` and `cacheTag` to the listing detail route and data loaders to
  keep the page static and tag-addressable.
- Split the favorite button out of the hero and isolate other user-specific islands behind
  `<Suspense>` while converting non-interactive sections to Server Components.
- Ensure review submissions and other user mutations call `updateTag`/revalidate hooks so cached
  sections refresh immediately.

## Impact
- Affected specs: listing-detail-cache
- Affected code: `app-next-directory/app/listings/[slug]/page.tsx`, listings UI components under
  `app-next-directory/src/components/listings/`, favorites/reviews client islands.
