# Change: Refactor Featured Listings module

## Why
Featured listings are implemented in multiple routes, DTOs, and data access paths, which causes
redundant fetches, inconsistent mapping, and higher maintenance cost. A single source of truth
reduces bugs and simplifies the build/prerender behavior.

## What Changes
- Consolidate featured listings to a single API route (keep `/api/featured-listings`, remove `/api/listings/featured`).
- Use a single FeaturedListing DTO definition across API, DAL, and UI.
- Use a single DAL entry point for featured listings; all callers delegate to it.
- Remove `FeaturedListingsLegacy` and client-side API fetching for featured listings.
- Update tests, mocks, and fixtures to reflect the unified module.

## Impact
- Affected code: API routes under `app/api`, DAL under `src/lib/data-access`, DTOs and transformers,
  and home page section components.
- Breaking change: removal of `/api/listings/featured` and the legacy client component.
