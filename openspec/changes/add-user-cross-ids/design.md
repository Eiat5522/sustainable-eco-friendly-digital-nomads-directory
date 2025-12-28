## Context
MongoDB is the system of record for users, while Sanity stores user documents for content references. Today, email is the linking key, but email can change. We need stable, system-generated IDs on both sides to keep records synchronized and prevent data drift.

## Goals / Non-Goals
- Goals:
  - Introduce `sanityId` on MongoDB users and `mongodbId` on Sanity users.
  - Ensure creation and sync flows store both IDs.
  - Support a Sanity-only `author` role for content attribution without login access.
  - Provide a one-time backfill path for existing users.
- Non-Goals:
  - Full historical audit of user changes.
  - Automated handling of conflicting manual edits in Sanity outside Admin Panel.

## Decisions
- Use system-generated IDs from each system (`_id` in Mongo, Sanity document `_id`) as the canonical cross-reference.
- Keep Sanity `email` editable for operational flexibility, but enforce edits through Admin Panel process.
- Prefer ID-based linking; use email only as a fallback during initial backfill/migration.
- Treat `author` as a Sanity-only role for attribution; no MongoDB or login behavior.

## Risks / Trade-offs
- Manual edits in Sanity can still introduce inconsistencies; mitigation is process + periodic audit scripts.
- Backfill may require manual mapping for users without matching emails.

## Migration Plan
1. Deploy schema changes (Mongo + Sanity).
2. Update sync/creation flows to write cross-IDs.
3. Run a one-time backfill script to populate missing IDs using email matching.
4. Manually resolve any unmatched users via export/import mapping if needed.

## Open Questions
- Should the backfill script be allowed to create missing Sanity users, or only link existing docs?
