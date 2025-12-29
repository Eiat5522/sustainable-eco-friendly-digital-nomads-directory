Plan: Venue owner listing quota enforcement

Goal
- Limit how many listing records a venueOwner can create or own.

High-level approach
- Add per-owner fields on the authoritative owner document: `maxLocations` (allowed) and optionally `locationCount` (current owned count).
- Enforce the quota at these points: listing creation, listing owner transfer (admin), and when an admin edits a listing owner.
- Prefer counting owned listings at enforcement time (queried count) to avoid cross-document consistency issues; `locationCount` may be maintained as an optimization with compensating updates and reconciliation scripts.

Suggested schema changes
1) Sanity `user` (or `venueOwner`) document
- Add: `maxLocations: number` (default: 1 or tier-based) and optional `locationCount: number`.
- Add optional: `listingQuotaTier: 'free'|'pro'|'enterprise'` for future features.
- Add optional: `quotaOverrideByAdmin: boolean` for special cases.

2) Listing document
- Keep `owner` reference as authoritative: `owner: { _type: 'reference', _ref: 'user-<id>' }`.
- Add `ownerHistory` array to track previous owners (actor, from, to, when) for audit and reconciliation.

Enforcement points (where to implement checks)
- Sanity create handler: `app-next-directory/app/api/listings/manage/route.ts` (POST)
  - Before creating, run a query to count listings with owner == candidate owner.
  - If count >= `maxLocations` (or no override), reject with 403/422 and message.
- Mongo create handler: `app-next-directory/app/api/listings/route.ts` (POST)
  - Same as above but with a Mongo count query on `listings` collection.
- Admin transfer/update endpoints:
  - Add an admin-only endpoint, e.g. `app-next-directory/app/api/admin/listings/transfer/route.ts`.
  - When reassigning owner X -> Y, check Y's quota first; then patch listing owner and append to `ownerHistory`.
  - Because Sanity lacks multi-document transactions, perform in this order: (1) patch listing owner; (2) update/patch owner documents if maintaining `locationCount`; (3) on failure of step (2), attempt to roll back (patch listing owner back) or create audit task to reconcile.

Implementation options (tradeoffs)
- Option A (recommended): Query-based enforcement
  - Implement: `count = await client.fetch('*[_type=="listing" && owner._ref==$ownerRef].count')` or Mongo `countDocuments`.
  - Pros: Simple, consistent (single source-of-truth), no counter drift.
  - Cons: Slightly more expensive on every create/transfer; acceptable for typical workloads.

- Option B: Maintain `locationCount` on user doc
  - Implement increments/decrements on create/delete/transfer.
  - Must be idempotent and include retries + reconciliation scripts.
  - Use this only if performance profiling shows count queries are a bottleneck.

Migration & backfill
- Add a migration script to set `maxLocations` for existing users (default to existing tiers or 1).
- Optionally compute and patch `locationCount` for owners if choosing Option B.

Tests to add
- Create tests for listing creation when owner at quota returns 403/422.
- Tests for admin transfer: transferring into an owner at quota should be rejected.
- Tests for edge cases: non-existent owner, owner with `quotaOverrideByAdmin`, concurrent creates (simulate) to ensure consistent rejection.

Developer notes / sample pseudo-code
- Sanity count query (JS):
  const existing = await client.fetch(`count(*[_type == "listing" && owner._ref == $ownerRef])`, { ownerRef });
  if (existing >= user.maxLocations) throw new Error('quota_exceeded');

- Mongo count query (JS):
  const existing = await listingsCollection.countDocuments({ ownerId: user._id });

- Admin transfer pseudo-flow:
  1) validate actor is admin
  2) validate listing exists
  3) validate newOwner exists and fetch `maxLocations`
  4) count newOwner's listings; if >= max => reject
  5) patch listing owner and append to ownerHistory
  6) return updated listing

Rollout plan
1) Add read-only enforcement using count queries in create endpoints and admin transfer endpoint.
2) Add migration to set `maxLocations` for all users.
3) Add monitoring (logs + metrics) to ensure no production surprises.
4) If needed, add `locationCount` maintenance and reconciliation job.

Next steps for me (I can implement if you want)
- Create PR adding `maxLocations` to Sanity `user` schema and implement server-side checks in create/update/transfer handlers.
- Add tests and migration script.

---

TODOs (for tracking)
- Scan repo for listing & owner code (done)
- Identify create/edit listing flows and admin transfer endpoints (in-progress)
- Propose schema fields and enforcement points (done — this document)
- Implement quota checks on create/update/transfer
- Add/update tests for quota enforcement
- Prepare patch and PR notes

Status
- Schema: added `listingQuotaTier`, `maxLocations`, `locationCount`, and `quotaOverrideByAdmin` to `sanity/schemas/user.js`.
- Server: added quota check to `app-next-directory/app/api/listings/manage/route.ts` POST handler to enforce per-owner limits on create.
- Next actions: run type generation and add tests + admin transfer enforcement.

Type generation
- After schema change, run one of:
  - At repo root: `pnpm typegen`
  - Or inside `sanity`: `pnpm sanity schema extract` then `pnpm sanity typegen generate`

I will now run the type generation commands (attempt `pnpm typegen` then fall back to the sanity-specific sequence).
