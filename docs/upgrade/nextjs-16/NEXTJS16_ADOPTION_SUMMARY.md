# Next.js 16+ Adoption — Cache Components & Server Features

Last updated: 2026-01-23

This document summarizes the repository's adoption of Next.js 16+ features and recommended patterns applied across the codebase to improve performance and developer ergonomics.

Key adoption points

- Cache Components (App-level cache components): the codebase is using Cache Components where appropriate to reduce server render work and re-computation for static or semi-static portions of pages.
- Partial Page Rendering (PPR): pages and layouts are structured to allow selective revalidation and partial updates rather than full-page rebuilds.
- Incremental Static Regeneration (ISR) / on-demand revalidation: API routes and revalidation endpoints are used to refresh cached content (revalidate and revalidateTag patterns) to keep pages fresh while serving cached content.
- Server Actions: server-side mutation handlers (Server Actions) are preferred where side-effects must run on the server; client components call Server Actions for secure mutations and side-effects.
- Server-side data fetching: use of server components and fetch-on-server patterns where appropriate, minimizing client bundle size and hydration cost.

Implementation notes and best practices in this repo

- Use `use cache` / `use cache: private` directives in modules that should be cached by default. Where data must be private to a session, use `use cache: private` and server-only fetches.
- Use `cacheTag()` and `cacheLife()` patterns (where available in the runtime) to scope cache invalidation to the smallest surface area.
- Prefer server components for pages and layout shells; only import client components when interactivity is required.
- For data that changes rarely, use ISR + on-demand revalidation endpoints (e.g., `/api/revalidate`) to keep static pages fast and up-to-date.
- Use Suspense boundaries for async server shells to keep the UI responsive while individual components load.
- When writing Server Actions, keep them idempotent and validate inputs server-side; avoid sending large payloads from client to server — use references/IDs where possible.

Migration & verification notes

- Branch: `staging/nextjs-16` contains the primary migration work for Cache Components and related patterns; the default branch remains `main`.
- Verify pages by running the dev server and reviewing MCP/diagnostics for cache warnings and runtime errors.
- Common issues: forgetting `use cache` in a module that returns renderable JSX or using client-only APIs inside server components.

References

- See `docs/upgrade/nextjs-16/` for detailed migration notes and examples.
- See `app-next-directory/docs/` for workspace-specific guidance (components & server-action examples).
