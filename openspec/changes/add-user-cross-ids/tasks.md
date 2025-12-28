## 1. Schema Updates
- [ ] 1.1 Add `sanityId` to MongoDB user schema/model and ensure it is optional for backfill.
- [ ] 1.2 Add `mongodbId` to Sanity user schema and make `email` editable in Studio.
- [ ] 1.3 Add Sanity-only `author` role to the user schema for attribution.

## 2. Sync & Creation Flow
- [ ] 2.1 Update Mongo→Sanity sync to write `mongodbId` when creating/updating Sanity users.
- [ ] 2.2 Update Sanity→Mongo linkage so `sanityId` is persisted in Mongo on Sanity user creation.
- [ ] 2.3 Ensure admin user creation sets both IDs and avoids email-based linking where possible.

## 3. Backfill Script
- [ ] 3.1 Add one-time migration script to populate missing cross-IDs for existing users.
- [ ] 3.2 Document manual mapping/export steps if the script cannot match users automatically.

## 4. Tests & Validation
- [ ] 4.1 Add/adjust unit tests for sync and linking logic.
- [ ] 4.2 Run typecheck and relevant tests.
