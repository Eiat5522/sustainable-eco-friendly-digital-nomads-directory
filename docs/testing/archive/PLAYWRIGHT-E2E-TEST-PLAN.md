# Playwright E2E Test Plan

This test plan covers the Playwright end-to-end scenarios described in section 4 (E2E Tests) of the project's `Initial_Findings_Report_Integration_&_E2E_&_Test.md`.

Purpose: provide clear, executable test scenarios for QA and CI that cover happy paths, edge cases, error handling, user roles, and cleanup for the Listings and Listing Detail flows and related features.

Assumptions (starting state)
- Tests run against a test environment with a stable base URL (set in `playwright.config.ts`).
- Database can be seeded and cleaned for test accounts and test content.
- Test users and credentials exist (see "Test Users" below) or can be created via API.
- All scenarios assume a fresh/clean state unless the scenario explicitly seeds data.
- Playwright config uses `storageState` for authenticated tests (one storage state per role).

Test data & test users
- Test listings use a recognizable test marker in slugs/titles, e.g., `test-...` or a tag `e2e:test` for cleanup.
- Recommended test users:
  - test_customer@example.com / password (Customer)
  - test_owner@example.com / password (VenueOwner)
  - test_admin@example.com / password (Admin) — optional for cleanup
- If API endpoints exist to create/delete test data, tests should use them for setup/teardown. If not, a shared seed fixture should be used.

General Playwright guidance
- Use test fixtures to manage baseURL and seeded data.
- Use `test.use({ storageState: 'storageStates/customer.json' })` for logged-in flows.
- Mark UI elements with data-testid attributes where possible to make selectors resilient (e.g., `data-testid="listing-card-<slug>"`).
- Use network routing to stub external services (maps, analytics) when necessary.
- Capture traces/screenshots on failure for debugging: `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`.
- Tag slow or flaky tests so CI can treat them differently.

Success criteria
- Each scenario has pass/fail determined by UI assertions and expected network calls (where applicable).
- Tests are independent and can run in any order.

Cleanup
- Every test that creates or mutates server-side state must either:
  - delete created entities via API during teardown; or
  - use a dedicated test tenant/environment that is reset between runs.
- Use identifiable markers (prefix `e2e:`) so cleanup tasks can find test objects.

How to run (examples)

Run all Playwright tests (project uses pnpm):
```bash
pnpm test:e2e
# or, if Playwright CLI is used directly
npx playwright test
```

Run a single file or test by grep:
```bash
npx playwright test tests/e2e/listings-filters.spec.ts
npx playwright test -g "Listing detail loads from card"
```

Files & naming conventions (recommended)
- `tests/e2e/listings-filters.spec.ts` — Filters & search flows
- `tests/e2e/listing-detail.spec.ts` — Listing detail page and deep-linking
- `tests/e2e/review-submission.spec.ts` — Review form flows
- `tests/e2e/favorites.spec.ts` — Favorites workflow
- `tests/e2e/owner-listing-management.spec.ts` — Venue owner create/edit flows
- `tests/e2e/navigation.spec.ts` — Header, breadcrumbs, back/forward

Detailed scenarios

## 1. Listings Filters (Customer Flow)
Title: Apply filters and search on `/listings` (desktop and mobile)
Assumptions: Seeded listings exist with different cities, categories and eco-tags. Test user is not required.
Success criteria: Results update to match filters; UI and counts update correctly.

Steps:
1. Visit `/listings`.
2. Assert page loads, main listing grid visible, and results count is displayed.
3. Open city filter, select a test city (e.g., "Testville").
4. Assert listing results update to show only `Testville` results and count reflects number of results.
5. Open category filter, select a category (e.g., "Coworking").
6. Assert listings are filtered by both city and category.
7. Toggle an eco-tag filter (e.g., "solar-powered").
8. Assert results further narrow and markers or tags in the listing cards include the eco-tag.
9. Test search: enter a keyword present in one listing title, submit search.
10. Assert only matching listing(s) appear and results count shows 1.
11. Mobile: resize viewport to a mobile-size (e.g., 375x812), open mobile filter drawer, repeat a sample filter and assert the mobile drawer closes after applying.

Edge cases & negative tests:
- Apply filters that produce 0 results and assert "No results" UI appears.
- Rapidly add/remove filters to check for race conditions.

Cleanup: none required (read-only).

## 2. Listing Detail Page
Title: Navigate from listings to listing detail, validate content and deep link
Assumptions: A listing with slug `test-listing-1` exists.
Success criteria: Detail page content loads correctly, breadcrumbs and gallery render, 404 behavior on invalid slug.

Steps:
1. From `/listings`, click the listing card for `test-listing-1`.
2. Assert navigation to `/listings/test-listing-1` and that the URL matches.
3. Verify page elements: title, gallery images (or fallback), description, amenities, host contact info, and reviews section are present.
4. Verify breadcrumb shows parent links and clicking breadcrumb navigates back to `/listings`.
5. Test direct deep link: navigate directly to `/listings/test-listing-1` in a fresh context (no JS state). Ensure page loads correctly and required data is rendered.
6. Validate meta tags / page title contains listing title (optional but recommended).
7. Invalid slug: navigate to `/listings/invalid-nonsense-slug` and assert that application shows 404 UI (and optionally that `notFound()` triggered server-side behavior via status code if test environment exposes it).

Edge cases & negative tests:
- Listing with no reviews: ensure reviews section displays the empty state message.
- Missing images: assert gallery fallback images or placeholders appear.

Cleanup: none required (read-only).

## 3. Review Submission
Title: Authenticated user submits a review; unauthenticated user is prompted to log in.
Assumptions: Review API exists; `test_customer` account has no prior review for `test-listing-1`.
Success criteria: On success, review appears in UI; unauthenticated users see login prompt or redirect.

Steps (authenticated):
1. Use storage state for `test_customer` or programmatically log in via an API login helper.
2. Navigate to `/listings/test-listing-1`.
3. Fill the review form: select rating (4), add comment "E2E test review" and optional fields.
4. Submit the review.
5. Assert network request to `POST /api/reviews` (or applicable endpoint) has the correct payload including listing id, rating, comment.
6. Assert success toast/message and that the new review appears in the reviews list.

Steps (unauthenticated):
1. In fresh context (no storage state), navigate to `/listings/test-listing-1`.
2. Click the review form CTA.
3. Assert redirect to login page or a login modal appears. If login modal appears, assert it contains the login form.

Edge cases & negative tests:
- Try submitting with missing required fields and assert validation errors.
- Submit very long review text (e.g., 10k chars) and assert truncation or validation error.
- Submit a review with a script tag and assert the content is sanitized in the rendered review.

Cleanup:
- Delete created review via API or mark as test data for cleanup.

## 4. Favorites Workflow
Title: Add/remove favorites, verify `/favorites` page, and unauthenticated fallback
Assumptions: `test_customer` exists and has an empty favorites list initially.
Success criteria: Favoriting toggles UI state and persists to `/favorites` listing; unauthenticated users are prompted to log in.

Steps (add favorite):
1. Log in as `test_customer` (use `storageState`).
2. Navigate to a listing card and click the favorite/heart icon.
3. Assert the UI toggles to the "favorited" state (icon changes, aria-pressed or aria-label updated).
4. Assert a network request to `POST /api/favorites` (or relevant endpoint) with correct listing id.
5. Visit `/favorites` and assert the listing appears in the list.

Steps (remove favorite):
1. From `/favorites`, click the remove/unfavorite action.
2. Assert network request to delete favorite and that the listing disappears from `/favorites`.

Steps (unauthenticated):
1. Fresh context (no storage state) navigate to a listings page and click favorite icon.
2. Assert login prompt/modal/redirect occurs.

Edge cases & negative tests:
- Rapidly click favorite/unfavorite to test idempotency and debounce behavior.
- Try favoriting a listing that is already favorited to ensure duplicates are not created.

Cleanup:
- Remove favorites created during test via API if not already removed by UI step.

## 5. Venue Owner – Listing Management (Create/Edit)
Title: Venue owner creates and edits a listing from their dashboard
Assumptions: `test_owner` account exists and is authorized to create listings. The create listing flow may involve file uploads and several required fields.
Success criteria: New listing is created, appears in listing index and detail pages; edits are applied.

Steps (create):
1. Log in as `test_owner` via storage state.
2. Navigate to owner dashboard (e.g., `/owner/listings/new`).
3. Fill required fields with test data, use `test-` prefixed title/slug, upload a small test image file.
4. Submit the form.
5. Assert network request to create listing and successful response (201 or similar).
6. Assert redirected to the new listing detail page and the new listing appears in the owner dashboard listing list.

Steps (edit):
1. From owner dashboard, open the listing created above.
2. Update a field (e.g., change title to include `-edited`).
3. Submit and assert update network request and UI shows new title.

Edge cases & negative tests:
- Submit invalid input (missing required fields) and assert validation errors.
- Try to create a listing with a slug that already exists and assert conflict handling.
- Test file upload failures (e.g., large file) and assert error handling.

Cleanup:
- Delete created listing via UI or API. If deletion is not immediate, tag it for background cleanup.

## 6. Navigation & Routing
Title: Header/menu navigation, breadcrumbs, and browser back/forward
Assumptions: Nav links exist and are deterministic.
Success criteria: Navigation occurs with correct URLs, history behaves as expected.

Steps:
1. Visit home page.
2. Click header link to `Listings` and assert navigate to `/listings`.
3. From listing detail page, click breadcrumb to go back to `/listings` and assert URL and page state.
4. Use browser back and forward to assert page content updates accordingly (playwright `page.goBack()` / `page.goForward()`).

Edge cases:
- Opening links in new tab behavior (target _blank) — if applicable, assert new context opens.

Cleanup: none required.

## 7. Navigation Deep Linking & 404
Title: Deep linking and 404 behavior
Assumptions: Server returns proper status for not found; client displays 404 UI.

Steps:
1. Navigate directly to `/listings/test-listing-1` — assert page loads.
2. Navigate directly to `/listings/invalid-slug-404` — assert 404 UI and status code if detectable.

Edge cases:
- Query params, anchor links, and unexpected path segments—assert graceful handling.


Security & Edge Testing (non-exhaustive)
- Cross-site scripting: submit `<script>alert(1)</script>` in reviews and assert the rendered content is sanitized.
- Long inputs: submit very long strings for title/description and assert either truncation or validation errors.
- Rate limiting: simulate rapid favorite toggles or review submissions and assert no duplicate records or server errors.

Performance / Flaky test mitigations
- Use stable waits: prefer `await expect(locator).toBeVisible()` over fixed sleeps.
- For animations, wait for `locator.isVisible()` or `hasClass` changes.
- Retries: enable test retries only for flaky tests in CI config, not for deterministic failures.

CI recommendations
- Run e2e tests in a dedicated test environment that can be reset between runs.
- Collect Playwright traces and artifacts on failure and upload them to CI job artifacts.
- Gate e2e runs behind a staging deploy job so they run against a stable build.

Appendix: Example Playwright test skeleton

```ts
import { test, expect } from '@playwright/test';

test.describe('Listings filters', () => {
  test('applies filters and updates results', async ({ page }) => {
    await page.goto('/listings');
    await expect(page.locator('data-testid=listing-grid')).toBeVisible();
    await page.click('data-testid=filter-city');
    await page.click('text=Testville');
    await expect(page.locator('data-testid=listing-card')).toHaveCount(2);
  });
});
```

Recommended next steps
- Add data-testid attributes where selectors are brittle.
- Create API helpers for test data setup/tear-down (seed/delete).
- Create `storageStates/*.json` for each role by logging in once via Playwright and saving state.


---

File created: `tests/PLAYWRIGHT-E2E-TEST-PLAN.md` — contains full E2E scenarios, assumptions, run commands, and CI guidance.
