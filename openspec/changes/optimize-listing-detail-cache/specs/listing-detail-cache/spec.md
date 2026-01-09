# Listing Detail Cache Requirements

## Requirement: Static cached listing detail route with tags

The system SHALL render the listing detail route (`/listings/[slug]`) as a cached Server Component page using long-lived cache life and listing-specific cache tags.

### Scenario: Listing page cache directives

- **WHEN** the listing detail page is rendered
- **THEN** it SHALL declare `use cache`, set `cacheLife('max')`, and apply `cacheTag(\`listing-${slug}\`)` for the requested slug

### Requirement: Server-rendered shell with client islands isolated by Suspense

The system SHALL keep non-interactive listing detail sections as Server Components and isolate any required client components behind `<Suspense>` to protect the static shell.

### Scenario: Hero and details stay server-side

- **WHEN** the listing hero, overview, category details, and contact info are rendered
- **THEN** they SHALL be Server Components without `use client`, and any user-specific controls (e.g., Favorite button) SHALL be split into separate client islands

### Scenario: Client islands are lazy and bounded

- **WHEN** client-only components such as favorites, reviews, gallery carousel, or map are used
- **THEN** they SHALL be loaded as client components wrapped in `<Suspense>` with appropriate fallbacks so the static shell streams without waiting on them

### Requirement: Review submissions trigger immediate cache updates

Review submission flows MUST trigger cache updates so new reviews appear without stale cached content.

### Scenario: Review submission updates tags

- **WHEN** a review is successfully submitted for a listing
- **THEN** the system SHALL call `updateTag` (or equivalent tag-based revalidation) for the listing’s reviews tag so subsequent renders show the new review immediately
