## ADDED Requirements
### Requirement: Featured Listings API Route
The system SHALL expose a single Featured Listings API route at `/api/featured-listings` and SHALL
remove any other Featured Listings API routes.

#### Scenario: Single endpoint for featured listings
- **WHEN** a client requests featured listings
- **THEN** the system serves the data only from `/api/featured-listings`

### Requirement: Featured Listings DTO
The system SHALL define a single `FeaturedListingDTO` and SHALL use it consistently across the API
route, DAL, and UI components.

#### Scenario: Consistent DTO mapping
- **WHEN** featured listings data is returned
- **THEN** the payload conforms to `FeaturedListingDTO` regardless of entry point

### Requirement: Featured Listings Data Access
The system SHALL provide a single DAL entry point for featured listings and all callers SHALL use
that entry point.

#### Scenario: Unified data access
- **WHEN** featured listings are requested by the API route or UI
- **THEN** data is obtained via the shared DAL function

### Requirement: Legacy Component Removal
The system SHALL remove the legacy client-fetching Featured Listings component and SHALL render
featured listings using the server-side implementation only.

#### Scenario: No legacy client fetch
- **WHEN** the home page renders featured listings
- **THEN** it does not perform client-side fetches to `/api/featured-listings`

### Requirement: Tests and Mocks Updated
The system SHALL update tests, mocks, and fixtures to reflect the single route and DTO.

#### Scenario: Test coverage for unified module
- **WHEN** unit and integration tests run
- **THEN** they target the unified API route and DAL behavior
