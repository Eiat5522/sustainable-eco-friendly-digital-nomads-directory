## 1. Implementation
- [ ] 1.1 Audit listing detail route for existing cache directives/tags and adjust to `use cache` + `cacheLife` + `cacheTag`.
- [ ] 1.2 Convert non-interactive listing detail components (hero, detail shell, category/contact sections) to Server Components and add Suspense wrappers for remaining client islands.
- [ ] 1.3 Extract FavoriteButton into its own island with a heart icon and wrap in Suspense; ensure ListingDetailView uses server data while delegating user-specific logic to clients.
- [ ] 1.4 Keep Gallery carousel and map as client where needed but wrap behind Suspense to protect the static shell.
- [ ] 1.5 Update ReviewsSection flow to trigger `updateTag`/revalidation so new reviews show immediately.

## 2. Validation
- [ ] 2.1 Run `pnpm lint` or targeted lint checks for touched files.
- [ ] 2.2 Run applicable unit tests for listings/favorites/reviews (e.g., `pnpm test:unit -- Listing` scope) or closest available suite.
