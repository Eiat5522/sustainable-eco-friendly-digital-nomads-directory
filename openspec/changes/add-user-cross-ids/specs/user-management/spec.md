## ADDED Requirements

### Requirement: Cross-system user identifiers
The system SHALL store a Sanity document ID on each MongoDB user record and a MongoDB user ID on each Sanity user document.

#### Scenario: User created via Admin Panel
- **WHEN** an admin creates a user in the app
- **THEN** the MongoDB user record stores `sanityId`
- **AND** the Sanity user document stores `mongodbId`

#### Scenario: User synchronized from MongoDB to Sanity
- **WHEN** a MongoDB user is synced to Sanity
- **THEN** the Sanity user document stores the MongoDB `_id` in `mongodbId`

### Requirement: Email editability in Sanity
The system SHALL allow the Sanity user `email` field to be edited in Sanity Studio while operational edits are enforced through the Admin Panel process.

#### Scenario: Sanity editor updates email
- **WHEN** a Sanity editor updates a user email in Studio
- **THEN** the system retains cross-system IDs to preserve linkage

### Requirement: Author role for attribution only
The system SHALL support a Sanity-only `author` role for content attribution, and users with this role SHALL NOT have app login access.

#### Scenario: Sanity editor creates author user
- **WHEN** a Sanity editor creates a user with role `author`
- **THEN** the user can be referenced in Sanity content

### Requirement: One-time backfill for existing users
The system SHALL provide a one-time migration path to populate missing cross-system IDs for existing users.

#### Scenario: Backfill uses email matching
- **WHEN** the migration script runs
- **THEN** it links users by email where possible
- **AND** it reports users that require manual mapping
