## Context
Featured listings currently exist in multiple API routes and data access layers, with both
server-rendered and client-fetching implementations. This creates duplicate fetches and divergent
DTO mappings.

## Goals / Non-Goals
- Goals: One API route, one DTO, one DAL entry point, and removal of legacy client-fetching UI.
- Non-Goals: Introducing new featured listings fields or changing the public payload semantics.

## Decisions
- Keep `/api/featured-listings` as the single API endpoint.
- Remove `/api/listings/featured` and any callers.
- Standardize on a single `FeaturedListingDTO` for all consumers.
- Use a single DAL function (e.g., `getFeaturedListings`) as the source of featured listings data.

## Risks / Trade-offs
- Removing the legacy component may require updating tests that relied on client-side fetches.
- Removing the alternate API route is a breaking change; ensure no internal consumers depend on it.

## Migration Plan
1. Update DAL and DTO to be the single source of truth.
2. Update API route to use the DAL and DTO.
3. Replace UI usage with server-rendered components that consume DAL output.
4. Remove legacy component and redundant API route; update tests.

## Open Questions
- Should the DTO live in `src/types` or be owned by the DAL module?
