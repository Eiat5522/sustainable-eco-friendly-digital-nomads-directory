## ADDED Requirements
### Requirement: Static homepage cache with tag revalidation
The system SHALL render the homepage with a static cache entry that uses long-lived freshness
and supports tag-based revalidation to regenerate the HTML shell on demand.

#### Scenario: Homepage cache configuration
- **WHEN** the homepage route is rendered
- **THEN** the route SHALL use `use cache` with `cacheLife('days')` and `cacheTag('home')`

#### Scenario: Tag-based revalidation
- **WHEN** the CMS webhook handler receives a valid update event
- **THEN** the system SHALL call `revalidateTag('home')` to invalidate the cached homepage
