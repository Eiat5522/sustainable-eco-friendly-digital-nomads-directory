# ✅ Integration & E2E Test Task List

## 📦 Phase 1: Preparation & Setup

- [ ] Ensure Jest is configured for integration tests.
- [ ] Ensure Playwright is set up with base URL and test users.
- [ ] Create test data fixtures (listings, users, cities).
- [ ] Document test roles and credentials (testuser, venueOwner, etc.).

---

## 🔬 Phase 2: Integration Tests (Jest + React Testing Library)

### 🧪 Listings Page (Filters + Search)
- [ ] Mount filter and listing components with mock data.
- [ ] Simulate city/category/eco-tag filters and assert filtered results.
- [ ] Test "No results" display.
- [ ] Mock map and assert marker rendering.

### 🧪 Listing Detail Page
- [ ] Test `ListingDetail` with full props:
  - [ ] Title, description, amenities, contact info.
  - [ ] Handle no-reviews fallback.
- [ ] Test `RelatedListings`:
  - [ ] Related items display properly.
  - [ ] Exclude current listing.
  - [ ] Handle empty state gracefully.

### 🧪 Review Form
- [ ] Validate required fields (rating, comment).
- [ ] Simulate form submission and mock fetch.
- [ ] Assert correct payload sent.

### 🧪 Favorite Toggle
- [ ] Test add/remove favorite interactions with mocked API.
- [ ] Test unauthenticated state fallback (e.g. login prompt).

### 🧪 Header & Routing
- [ ] Simulate header nav clicks and assert `router.push()` is called.
- [ ] Simulate city card clicks (carousel) and assert navigation.

### 🧪 404 & Error Handling
- [ ] Simulate invalid slug → assert `notFound()` triggers 404 UI.

---

## 📦 Phase 3: DTO Integration Tests

### 🧾 DTO Validation
- [ ] Instantiate DTOs with mock Sanity data and validate transformation.
- [ ] Use DTOs in integration test mocks (props, API responses).
- [ ] Assert API route responses match DTO-transformed shape.
- [ ] (Optional) Use zod/io-ts to validate raw GROQ → DTO mapping.

---

## 🧭 Phase 4: E2E Tests (Playwright)

### 🔍 Listings Filters (Customer Flow)
- [ ] Navigate to `/listings`, apply filters, assert result updates.
- [ ] Test search bar keyword + submission.
- [ ] Test mobile filter UI (responsive drawer).

### 📄 Listing Detail Page
- [ ] Navigate via listing card → assert detail loads.
- [ ] Check breadcrumb, gallery, description, reviews.
- [ ] Test invalid slug → assert 404.
- [ ] Test deep linking directly to `/listings/[slug]`.

### 💬 Review Submission
- [ ] Log in → submit review → assert display and success message.
- [ ] Try as unauthenticated → assert redirect or login prompt.

### ❤️ Favorites Workflow
- [ ] Log in → favorite a listing → check UI state and toast.
- [ ] Visit `/favorites` page → assert listing appears.
- [ ] Remove favorite and verify removal.
- [ ] Try unauthenticated → assert fallback.

### 🧑‍💼 Venue Owner – Listing Management
- [ ] Log in as venueOwner.
- [ ] Create new listing, fill form, and submit.
- [ ] Edit listing → assert update in dashboard.

### 🔗 Navigation & Routing
- [ ] Test header menu links between pages.
- [ ] Use breadcrumb to navigate back.
- [ ] Test browser back/forward functionality.

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

