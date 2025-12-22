Plan: Remove Sanity Auth

TL;DR: Remove all Sanity-based authentication code, make MongoDB the single auth source, force-refresh sessions, and refactor tests to use only Mongo role enums. This eliminates legacy Sanity roles and simplifies admin auth.

Steps
1. Remove Sanity auth usage
   - Delete or disable `ensureSanityUser` and related calls in `app-next-directory/src/lib/sanity/user.ts`.
   - Remove any runtime checks that query Sanity for roles or authentication.

2. Update Sanity schema
   - Remove `role` from `sanity/schemas/user.js` or mark it read-only for CMS-only use so Sanity no longer drives authorization.

3. Enforce Mongo roles
   - Ensure `ROLE_VALUES` in `app-next-directory/src/models/User.ts` contains canonical roles.
   - Ensure DAL methods (`getUserById`, `getUserByEmail`) in `app-next-directory/src/lib/auth/dal.ts` are the only sources for role data.

4. Update NextAuth
   - Keep adapter logic in `app-next-directory/src/lib/auth/adapter.ts` but ensure `authOptions` and callbacks in `app-next-directory/src/lib/auth.ts` always read roles from Mongo (via `getUserById`) and never from Sanity.

5. Harden middleware/routes
   - Update `app-next-directory/proxy.ts` and middleware under `app-next-directory/src/middleware` to re-validate admin roles using Mongo `getUserById` before executing sensitive actions.

6. Refactor tests and mocks
   - Replace legacy role literals in tests under `app-next-directory/src` with canonical `ROLE_VALUES` only.
   - Remove any test/stub behavior that maps legacy Sanity roles; tests should mock Mongo-only roles.

7. Force session refresh
   - Implement a token invalidation strategy (e.g., rotate JWT secret or add `tokenVersion` in Mongo user docs) and update session logic so old tokens no longer grant access.

Further Considerations
- Migration: No automatic Sanity->Mongo role mapping will be applied. You will manually map and update any test DB users as needed since the test DB is small.
- Sessions: Because you prefer a forced refresh, plan to rotate secrets or bump a `tokenVersion` to require re-login.
- Tests: Update tests to reference canonical Mongo roles; do not keep legacy role mapping in test code.

Next steps
- If you confirm, I'll begin editing the codebase: remove Sanity auth calls, update NextAuth/middleware to use Mongo-only checks, and update tests. I will update the todo list as I progress.

Notes
- File created for refinement: untitled:plan-removeSanityAuth.prompt.md

Concrete edit list (file-by-file)

- `app-next-directory/src/lib/sanity/user.ts`
   - Remove or disable `ensureSanityUser`, `ensureSanityUserInternal`, and any functions that attempt to create/update roles for auth purposes.
   - Keep helper utilities that strictly manage CMS-only fields (favorites, profiles) but ensure they do not participate in authentication or role checks.
   - Remove all imports/usages of these helpers from auth flows.

- `app-next-directory/src/lib/sanity/client.ts`
   - Keep client for CMS operations only, but clearly mark it as CMS-only in comments and exports.
   - Remove or export a `cmsClient` symbol and avoid exporting auth-facing helpers.

- `sanity/schemas/user.js`
   - Remove the `role` field entirely, or mark it explicitly read-only and document that it is CMS metadata only (no effect on authorization).

- `app-next-directory/src/models/User.ts`
   - Ensure `ROLE_VALUES` equals `['user','venueOwner','admin','superAdmin']` and export it as the canonical source.
   - Add optional `tokenVersion` numeric field to the user interface/schema (default 0) to support forced session invalidation.

- `app-next-directory/src/lib/auth/dal.ts`
   - Ensure `getUserById` / `getUserByEmail` are the single sources of truth for role and tokenVersion. Remove any Sanity fallbacks.

- `app-next-directory/src/lib/auth/adapter.ts`
   - Keep Mongo adapter usage; ensure it is the only adapter used in production for user/session persistence.

- `app-next-directory/src/lib/auth.ts`
   - Update NextAuth `callbacks.jwt` and `callbacks.session` to always refresh role and `tokenVersion` from Mongo `getUserById` when token or session is created/updated.
   - Remove any code that reads or synchronizes role from Sanity.

- `app-next-directory/proxy.ts` and `app-next-directory/src/middleware/**`
   - Replace any role checks against Sanity with a DAO call to `getUserById` (or, if only a JWT role is present, validate `tokenVersion` matches DB). For admin routes, always revalidate against Mongo prior to performing sensitive actions.

- `app-next-directory/src/lib/admin/analytics.ts`
   - Stop using Sanity role counts as an authorization signal. For analytics only, either translate Sanity strings to canonical roles (read-only report) or use Mongo counts as source of truth.

- Tests and mocks
   - `app-next-directory/src/lib/sanity/user.test.ts` and any tests that included legacy role values must be refactored or removed if they test auth behavior. Tests should only assert CMS-only behavior for Sanity helpers (no role-based auth).
   - Update middleware and auth tests (e.g., `src/middleware/__tests__/*`, `src/lib/auth/*.test.ts`) to mock Mongo `getUserById` and use canonical `ROLE_VALUES` only.

- Misc
   - Add a small script `/scripts/report-sanity-roles.js` (optional) that lists distinct `role` values in Sanity to assist manual mapping; run it once and keep the output in `/tmp/sanity-roles-report.json` for reference.

Sanity roles report (current snapshot)

- From `sanity/schemas/user.js` role options: `['user','editor','venueOwner','admin']` (initialValue: `user`).
- From repository tests and legacy code: observed legacy values `['moderator','business_owner','super_admin']` (occurs in `app-next-directory/src/lib/sanity/user.test.ts` and other test fixtures).
- From `app-next-directory/src/lib/sanity/user.ts` behavior: default fallback role used is `'user'` when none provided.

Session invalidation recommendation

- Recommended approach: add a `tokenVersion` integer field to the Mongo `User` model and embed the `tokenVersion` in issued JWTs. When you need to force-refresh sessions, increment the `tokenVersion` for the affected users in Mongo; JWT validation will fail when versions mismatch, forcing re-login.
- Rationale: `tokenVersion` is less error-prone than rotating global JWT secrets (which can affect other services and require secret distribution). It is reversible and easily targeted (e.g., bump only admin accounts if desired).

Safe rollback checklist

1. Create a feature branch and push changes before applying any migrations.
2. Backup exports:
    - Export Sanity user documents: `sanity dataset export <dataset> /tmp/sanity-users-roles.tar.gz --raw` (or use studio export UI).
    - Dump Mongo `users` collection: `mongodump --uri="$MONGODB_URI" --collection=users --out=/tmp/mongo-users-backup`.
3. Add feature-flag toggles where appropriate (e.g., `REMOVE_SANITY_AUTH=true`) so changes can be rolled back quickly by enabling/disabling the flag.
4. Run full test suite locally and in CI (`pnpm test:unit`, `pnpm test:integration`).
5. Deploy to staging and smoke-test protected admin routes, login flows, and user sessions.
6. If issues found, revert the feature branch and restore data from backups; if role translations were applied manually, document the mapping and reverse it if needed.
7. Record all DB changes in a change-log file under `scripts/migrations/` so manual actions are auditable and reversible.

Next actions I can take now (confirm one):
- A: Implement the code edits listed above and update tests accordingly (I will update the todo list as I progress).
- B: Only create the helper `scripts/report-sanity-roles.js` and produce the `/tmp/sanity-roles-report.json` for you to map manually.
- C: Prepare the migration and tokenVersion change PR with tests and a staging deployment plan.

Please confirm which next action you want me to take.
