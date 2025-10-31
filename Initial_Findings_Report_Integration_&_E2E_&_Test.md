# ✅ Integration & E2E Test Task List

## 📦 Phase 1: Preparation & Setup

- [x] Ensure Jest is configured for integration tests.
- [x] Ensure Playwright is set up with base URL and test users.
- [x] Create test data fixtures (listings, users, cities).
- [x] Document test roles and credentials (testuser, venueOwner, etc.).

---

## 🔬 Phase 2: Integration Tests (Jest + React Testing Library)

### 🧪 Listings Page (Filters + Search)
- [x] Mount filter and listing components with mock data.
- [x] Simulate city/category/eco-tag filters and assert filtered results.
- [x] Test "No results" display.
- [x] Mock map and assert marker rendering.

### 🧪 Listing Detail Page
- [x] Test `ListingDetail` with full props:
  - [x] Title, description, amenities, contact info.
  - [x] Handle no-reviews fallback.
- [x] Test `RelatedListings`:
  - [x] Related items display properly.
  - [x] Exclude current listing.
  - [x] Handle empty state gracefully.

### 🧪 Review Form
- [x] Validate required fields (rating, comment).
- [x] Simulate form submission and mock fetch.
- [x] Assert correct payload sent.

### 🧪 Favorite Toggle
- [x] Test add/remove favorite interactions with mocked API.
- [x] Test unauthenticated state fallback (e.g. login prompt).

### 🧪 Header & Routing
- [x] Simulate header nav clicks and assert `router.push()` is called.
- [x] Simulate city card clicks (carousel) and assert navigation.

### 🧪 404 & Error Handling
- [x] Simulate invalid slug → assert `notFound()` triggers 404 UI.

---

## 📦 Phase 3: DTO Integration Tests

### 🧾 DTO Validation
- [x] Instantiate DTOs with mock Sanity data and validate transformation.
- [x] Use DTOs in integration test mocks (props, API responses).
- [x] Assert API route responses match DTO-transformed shape.
- [x] Comprehensive integration tests covering all DTO types and edge cases.
  - **File**: `app-next-directory/src/tests/integration/dto-transformation.integration.test.ts`
  - **Status**: ✅ COMPLETED - 27 tests covering FeaturedListingDTO, ListingSummaryDTO, ListingDetailDTO, Blog DTOs, type safety, and edge cases
- [ ] (Optional) Use zod/io-ts to validate raw GROQ → DTO mapping.

---

## 🧭 Phase 4: E2E Tests (Playwright)

### 🔍 Listings Filters (Customer Flow)
- [x] Navigate to `/listings`, apply filters, assert result updates.
  - **File**: `app-next-directory/tests/e2e/listings-filters.spec.ts`
  - **Status**: Desktop and mobile filter tests implemented
- [x] Test search bar keyword + submission.
  - **File**: `app-next-directory/tests/e2e/listings-filters.spec.ts`
  - **Status**: Search input and submission implemented
- [x] Test mobile filter UI (responsive drawer).
  - **File**: `app-next-directory/tests/e2e/listings-filters.spec.ts`
  - **Status**: Mobile viewport test with drawer implemented

### 📄 Listing Detail Page
- [x] Navigate via listing card → assert detail loads.
  - **File**: `app-next-directory/tests/e2e/listing-detail.spec.ts`
  - **Status**: Navigation from card to detail implemented
- [x] Check breadcrumb, gallery, description, reviews.
  - **Files**: `app-next-directory/tests/e2e/listing-detail.spec.ts`, `listing-detail-page.spec.ts`, `listing-detail-media.spec.ts`
  - **Status**: Content validation tests implemented
- [x] Test invalid slug → assert 404.
  - **File**: `app-next-directory/tests/e2e/listing-detail.spec.ts`
  - **Status**: 404 handling test implemented
- [x] Test deep linking directly to `/listings/[slug]`.
  - **File**: `app-next-directory/tests/e2e/listing-detail.spec.ts`
  - **Status**: Deep link test implemented

### 💬 Review Submission
- [x] Log in → submit review → assert display and success message.
  - **File**: `app-next-directory/tests/e2e/reviews.spec.ts`, `reviews-real.spec.ts`
  - **Status**: Authenticated review submission implemented
- [x] Try as unauthenticated → assert redirect or login prompt.
  - **File**: `app-next-directory/tests/e2e/reviews.spec.ts`
  - **Status**: Unauthenticated user prompt test implemented

### ❤️ Favorites Workflow
- [x] Log in → favorite a listing → check UI state and toast.
  - **File**: `app-next-directory/tests/e2e/favorites-ui-toggle.spec.ts`
  - **Status**: Favorite toggle UI test implemented
- [x] Visit `/favorites` page → assert listing appears.
  - **File**: `app-next-directory/tests/e2e/favorites-page.spec.ts`
  - **Status**: ✅ COMPLETED - Full favorites page tests implemented
- [x] Remove favorite and verify removal.
  - **File**: `app-next-directory/tests/e2e/favorites-ui-toggle.spec.ts`
  - **Status**: Unfavorite action test implemented
- [x] Try unauthenticated → assert fallback.
  - **File**: `app-next-directory/tests/e2e/favorites-ui-toggle.spec.ts`
  - **Status**: ✅ COMPLETED - Unauthenticated user handling tests implemented

### 🧑‍💼 Venue Owner – Listing Management
- [x] Log in as venueOwner.
  - **File**: `app-next-directory/tests/e2e/listing-management.spec.ts`
  - **Status**: Role-based access tests implemented
- [x] Create new listing, fill form, and submit.
  - **File**: `app-next-directory/tests/e2e/listing-management.spec.ts`
  - **Status**: Test structure created (needs implementation detail verification)
- [x] Edit listing → assert update in dashboard.
  - **File**: `app-next-directory/tests/e2e/listing-management.spec.ts`
  - **Status**: Test structure created (needs implementation detail verification)

### 🔗 Navigation & Routing
- [x] Test header menu links between pages.
  - **File**: `app-next-directory/tests/e2e/responsive-navigation-layout.spec.ts`
  - **Status**: Navigation tests implemented
- [x] Use breadcrumb to navigate back.
  - **File**: `app-next-directory/tests/e2e/listing-detail.spec.ts`
  - **Status**: Breadcrumb navigation test implemented
- [x] Test browser back/forward functionality.
  - **File**: `app-next-directory/tests/e2e/browser-navigation.spec.ts`
  - **Status**: ✅ COMPLETED - Browser navigation tests implemented

---

## 🧹 Phase 5: Cleanup & Edge Cases

### 🧼 Cleanup
- [ ] Clean up test data after runs (favorites, reviews, listings).
- [ ] Use test-only data IDs or markers for cleanup logic.

### 🔐 Security & Edge Testing
- [ ] Submit overly long strings → assert validation.
- [ ] Submit `<script>` in review/comment → assert sanitization.
- [ ] Rapid-fire API actions (e.g. favoriting) → assert no crash or duplicates.

---

## 🧾 Optional: CI & Documentation

- [ ] Document test cases and structure in README or `/tests/README.md`.
- [ ] Add CI instructions and environment setup.
- [ ] Export coverage reports (Jest) and Playwright HTML results.
