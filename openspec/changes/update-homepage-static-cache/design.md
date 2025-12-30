## Context
The Next.js 16 homepage currently renders without explicit cache directives and lacks a
webhook-triggered revalidation path. We want a fully static route with long-lived caching
and on-demand invalidation by tag.

## Goals / Non-Goals
- Goals:
  - Ensure the homepage is eligible for the full route cache and static HTML shell.
  - Add tag-based cache invalidation tied to CMS updates.
  - Preserve prefetching behavior for faster navigation.
- Non-Goals:
  - Redesign homepage UI or change content sources.
  - Introduce new external caching layers.

## Decisions
- Decision: Use `use cache`, `cacheLife('days')`, and `cacheTag('home')` in the homepage route.
  - Why: Aligns with Next.js caching primitives for full route caching and tag invalidation.
- Decision: Implement a webhook handler/server action that calls `revalidateTag('home')`.
  - Why: Allows immediate regeneration without shortening cache TTLs.

## Risks / Trade-offs
- Long cache lifetimes require the webhook to function correctly; stale content can persist
  if webhooks fail.
  - Mitigation: Log webhook failures and monitor CMS delivery.

## Migration Plan
1. Apply cache directives to the homepage and remove legacy dynamic flags.
2. Add the revalidation handler and document the CMS webhook endpoint.
3. Verify homepage renders statically and revalidates on tag invalidation.

## Open Questions
- Which CMS webhook source (Sanity or other) will call the revalidation handler?
