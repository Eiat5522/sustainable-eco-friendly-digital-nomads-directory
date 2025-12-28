# Change: Add cross-system user IDs between MongoDB and Sanity

## Why
Email is currently used to link user records across MongoDB and Sanity, but emails can change over time. We need stable, system-generated identifiers to ensure reliable synchronization and reduce integrity risks.

## What Changes
- Add `sanityId` to MongoDB user records and `mongodbId` to Sanity user documents.
- Make Sanity `email` field editable (process-enforced edits via Admin Panel).
- Update user creation and sync flows to set and maintain cross-IDs.
- Add a Sanity-only `author` role for content attribution without app login access.
- Provide a one-time backfill/migration path for existing users.

## Impact
- Affected specs: user-management (new capability spec).
- Affected code: Mongo user schema, Sanity user schema, user sync utilities, admin user management flows, auth access rules, migration scripts.
