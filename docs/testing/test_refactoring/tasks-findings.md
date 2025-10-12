# Test Refactoring Research: External Systems & Component Coverage Findings

**Date:** October 12, 2025  
**Purpose:** Catalogue tests touching external systems and audit component test coverage to prioritize refactoring efforts.

---

## Section 1: Tests Touching External Systems

This section identifies all test files that interact with external systems (Sanity, MongoDB/Mongoose, Redis). Tests are categorized by the external system they touch. Note that tests marked with "(MOCKED)" use mocking libraries but are included for completeness.

### 1.1 Sanity CMS Tests

#### Tests Potentially Touching Sanity (Requires Verification)
- **File:** `app-next-directory/src/__tests__/api/featured-listings/route.test.ts`
  - **System:** Sanity
  - **Notes:** This test may use Sanity client. Requires verification to confirm if it connects to actual Sanity or uses mocks from `__mocks__/@sanity/client.ts`.

#### Tests Using Mocked Sanity (For Reference)
- **File:** `app-next-directory/src/__tests__/api/search/route.test.ts`
  - **System:** Sanity (MOCKED)
  - **Notes:** Uses jest.mock for Sanity client
  
- **File:** `app-next-directory/src/__tests__/lib/sanity-cached-client.test.ts`
  - **System:** Sanity (MOCKED)
  - **Notes:** Uses jest.mock for Sanity client
  
- **File:** `app-next-directory/src/__tests__/lib/sanity-http-client.test.ts`
  - **System:** Sanity (MOCKED)
  - **Notes:** Tests SanityHTTPClient with mocked @sanity/client
  
- **File:** `app-next-directory/src/lib/auth/userService.test.ts`
  - **System:** Sanity (MOCKED)
  - **Notes:** Uses jest.mock for Sanity client
  
- **File:** `app-next-directory/src/lib/sanity/client.test.ts`
  - **System:** Sanity (MOCKED)
  - **Notes:** Uses jest.mock for Sanity client
  
- **File:** `app-next-directory/src/tests/sanity-client.test.ts`
  - **System:** Sanity (MOCKED)
  - **Notes:** Uses jest.mock for Sanity client

### 1.2 MongoDB/Mongoose Tests

#### Tests Touching MongoDB/Mongoose (No Mocking)
- **File:** `app-next-directory/app/api/auth/update-profile/route.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests profile update functionality with database interactions
  
- **File:** `app-next-directory/app/api/reviews/route.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests review API endpoints with database
  
- **File:** `app-next-directory/tests/e2e/security/security.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** E2E security tests that may interact with MongoDB
  
- **File:** `app-next-directory/src/models/__tests__/ContactSubmission.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests ContactSubmission model schema and methods
  
- **File:** `app-next-directory/src/models/__tests__/AnalyticsEvent.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests AnalyticsEvent model schema and methods
  
- **File:** `app-next-directory/src/models/__tests__/UserAnalytics.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests UserAnalytics model schema and methods
  
- **File:** `app-next-directory/src/models/__tests__/NewsletterSubscriber.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests NewsletterSubscriber model schema and methods
  
- **File:** `app-next-directory/src/models/__tests__/PasswordResetToken.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests PasswordResetToken model schema and methods
  
- **File:** `app-next-directory/src/models/__tests__/UserFavorite.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests UserFavorite model schema and methods
  
- **File:** `app-next-directory/src/models/__tests__/EmailVerificationToken.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests EmailVerificationToken model schema and methods
  
- **File:** `app-next-directory/src/models/__tests__/LoginAttempt.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests LoginAttempt model schema and methods
  
- **File:** `app-next-directory/src/models/__tests__/User.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests User model schema, validation, and methods
  
- **File:** `app-next-directory/src/utils/__tests__/db-helpers.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests database helper utilities
  
- **File:** `app-next-directory/src/lib/auth/adapter.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests authentication adapter with database
  
- **File:** `app-next-directory/src/lib/__tests__/auth.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests authentication logic with database
  
- **File:** `app-next-directory/src/lib/__tests__/envLoader.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests environment loading, may reference MongoDB URIs
  
- **File:** `app-next-directory/src/lib/__tests__/dbConnect-simplified.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests database connection logic
  
- **File:** `app-next-directory/src/__tests__/mongodb.test.js`
  - **System:** MongoDB/Mongoose
  - **Notes:** General MongoDB integration tests
  
- **File:** `app-next-directory/src/__tests__/lib/mongoose-cache.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests Mongoose caching functionality
  
- **File:** `app-next-directory/src/__tests__/db-helpers.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Tests database helper utilities (duplicate in different location)
  
- **File:** `app-next-directory/src/__tests__/auth/auth-basic.test.ts`
  - **System:** MongoDB/Mongoose
  - **Notes:** Basic authentication tests that may use database

#### Tests Using MongoMemoryServer (Integration Tests)
- **File:** `app-next-directory/src/lib/__tests__/dbConnect.integration.test.ts`
  - **System:** MongoDB/Mongoose (MongoMemoryServer)
  - **Notes:** Integration test using in-memory MongoDB for testing database connections

#### Tests Using Mocked MongoDB/Mongoose (For Reference)
- **File:** `app-next-directory/app/api/auth/register/route.test.ts`
  - **System:** MongoDB/Mongoose (MOCKED)
  - **Notes:** Tests registration with mocked database connections
  
- **File:** `app-next-directory/src/__tests__/auth/rate-limiting.test.ts`
  - **System:** MongoDB/Mongoose (MOCKED)
  - **Notes:** Tests rate limiting with mocked dependencies
  
- **File:** `app-next-directory/src/lib/auth/rateLimit.test.ts`
  - **System:** MongoDB/Mongoose (MOCKED)
  - **Notes:** Tests rate limiting utilities with mocks
  
- **File:** `app-next-directory/src/lib/auth/serverAuth.test.ts`
  - **System:** MongoDB/Mongoose (MOCKED)
  - **Notes:** Tests server-side authentication with mocks

### 1.3 Redis Tests

#### Tests Touching Redis (No Mocking)
- **File:** `app-next-directory/app/api/newsletter/subscribe/route.test.ts`
  - **System:** Redis
  - **Notes:** Tests newsletter subscription with Redis for rate limiting/caching
  
- **File:** `app-next-directory/src/__tests__/api/blog/route.test.ts`
  - **System:** Redis
  - **Notes:** Tests blog API endpoints with Redis caching
  
- **File:** `app-next-directory/src/__tests__/auth/auth-integration.test.ts`
  - **System:** Redis
  - **Notes:** Integration tests for authentication with Redis session storage
  
- **File:** `app-next-directory/src/__tests__/auth/auth-basic.test.ts`
  - **System:** Redis
  - **Notes:** Basic authentication tests that may use Redis

#### Tests Using Mocked Redis (For Reference)
- **File:** `app-next-directory/src/__tests__/api/newsletter/subscribe-redis.test.ts`
  - **System:** Redis (MOCKED)
  - **Notes:** Tests newsletter subscription with mocked Redis client
  
- **File:** `app-next-directory/src/__tests__/auth/rate-limiting.test.ts`
  - **System:** Redis (MOCKED)
  - **Notes:** Tests rate limiting with mocked Redis
  
- **File:** `app-next-directory/src/__tests__/lib/mongoose-cache.test.ts`
  - **System:** Redis (MOCKED)
  - **Notes:** Tests Mongoose cache with mocked Redis
  
- **File:** `app-next-directory/src/__tests__/lib/redis-integration.test.ts`
  - **System:** Redis (MOCKED)
  - **Notes:** Integration tests for Redis TypeScript improvements with mocks
  
- **File:** `app-next-directory/src/__tests__/lib/redis.test.ts`
  - **System:** Redis (MOCKED)
  - **Notes:** Tests Redis client wrapper with mocks
  
- **File:** `app-next-directory/src/__tests__/lib/sanity-cached-client.test.ts`
  - **System:** Redis (MOCKED)
  - **Notes:** Tests Sanity client caching with mocked Redis
  
- **File:** `app-next-directory/src/lib/auth/rateLimit.test.ts`
  - **System:** Redis (MOCKED)
  - **Notes:** Tests rate limiting with mocked Redis

### Summary of External System Tests

| External System | Tests Without Mocking | Tests With Mocking | Total |
|-----------------|----------------------|-------------------|-------|
| **Sanity** | 1 | 6 | 7 |
| **MongoDB/Mongoose** | 22 | 4 | 26 |
| **Redis** | 4 | 7 | 11 |
| **Total** | **27** | **17** | **44** |

---

## Section 2: Component Coverage Audit

This section audits the test coverage of components within `app-next-directory/src/components/` and prioritizes critical gaps.

### 2.1 Component Test Coverage Summary

**Total Components:** 59  
**Components With Tests:** 21 (35.6%)  
**Components Without Tests:** 38 (64.4%)

### 2.2 Components WITH Tests (21 components)

1. `src/components/AnalyticsProvider.tsx`
2. `src/components/AnimatedNumber.tsx`
3. `src/components/CommentForm.tsx`
4. `src/components/CommentList.tsx`
5. `src/components/Providers.tsx`
6. `src/components/city/CityDetailView.tsx`
7. `src/components/layout/Header.tsx`
8. `src/components/listings/HeroSection.tsx`
9. `src/components/listings/ListingDetailView.tsx`
10. `src/components/listings/NoListingsFound.tsx`
11. `src/components/listings/ReviewsSection.tsx`
12. `src/components/profile/ProfileEditForm.tsx`
13. `src/components/sections/CityCarousel.tsx`
14. `src/components/sections/FeaturedListings.tsx`
15. `src/components/ui/SectionHeader.tsx`
16. `src/components/ui/StarRating.tsx`
17. `src/components/ui/label.tsx`
18. `src/components/ui/neo-badge.tsx`
19. `src/components/ui/separator.tsx`
20. `src/components/ui/skip-link.tsx`
21. `src/components/ui/textarea.tsx`

### 2.3 Components WITHOUT Tests - Prioritized by Criticality

#### 🔴 CRITICAL Priority (10 components)
**Core business logic, authentication, and primary user interactions**

1. **`src/components/search/SearchBox.tsx`**
   - **Category:** Search functionality
   - **Priority:** CRITICAL
   - **Reason:** Primary search input component used throughout the application

2. **`src/components/search/SearchForm.tsx`**
   - **Category:** Search functionality
   - **Priority:** CRITICAL
   - **Reason:** Main search form handling search queries and filters

3. **`src/components/search/DigitalNomadSearch.tsx`**
   - **Category:** Search functionality
   - **Priority:** CRITICAL
   - **Reason:** Core search component for digital nomad listings

4. **`src/components/search/FiltersSidebar.tsx`**
   - **Category:** Search functionality
   - **Priority:** CRITICAL
   - **Reason:** Sidebar containing search filters

5. **`src/components/search/SearchFiltersForm.tsx`**
   - **Category:** Search functionality
   - **Priority:** CRITICAL
   - **Reason:** Form component managing search filter state and submission

6. **`src/components/favorites/FavoriteButton.tsx`**
   - **Category:** User interaction
   - **Priority:** CRITICAL
   - **Reason:** User favorite/bookmark functionality - core user engagement feature

7. **`src/components/auth/SocialAuthRow.tsx`**
   - **Category:** Authentication
   - **Priority:** CRITICAL
   - **Reason:** Social authentication integration (OAuth providers)

8. **`src/components/listings/ListingGrid.tsx`**
   - **Category:** Core business logic
   - **Priority:** CRITICAL
   - **Reason:** Displays grid of listings - central to the application's purpose

9. **`src/components/listings/ListingDetailsCard.tsx`**
   - **Category:** Core business logic
   - **Priority:** CRITICAL
   - **Reason:** Displays detailed listing information - key conversion component

10. **`src/components/listings/RelatedListings.tsx`**
    - **Category:** Core business logic
    - **Priority:** CRITICAL
    - **Reason:** Shows related listings - drives user engagement and discovery

#### 🟡 HIGH Priority (6 components)
**Layout, navigation, and homepage sections with high visibility**

11. **`src/components/layout/Footer.tsx`**
    - **Category:** Layout/Navigation
    - **Priority:** HIGH
    - **Reason:** Site-wide footer with navigation and links

12. **`src/components/layout/PageLayout.tsx`**
    - **Category:** Layout/Navigation
    - **Priority:** HIGH
    - **Reason:** Main page layout wrapper used across the application

13. **`src/components/sections/AboutSection.tsx`**
    - **Category:** Homepage sections
    - **Priority:** HIGH
    - **Reason:** About section on homepage - first impression for users

14. **`src/components/sections/CategoryFilters.tsx`**
    - **Category:** Homepage sections
    - **Priority:** HIGH
    - **Reason:** Category filtering on homepage

15. **`src/components/sections/HeroSection.tsx`**
    - **Category:** Homepage sections
    - **Priority:** HIGH
    - **Reason:** Hero section - first thing users see

16. **`src/components/sections/TestimonialsSection.tsx`**
    - **Category:** Homepage sections
    - **Priority:** HIGH
    - **Reason:** Testimonials section - social proof and trust building

#### 🟢 MEDIUM Priority (10 components)
**Interactive features and commonly used UI components**

17. **`src/components/ui/InteractiveMap.tsx`**
    - **Category:** Interactive features
    - **Priority:** MEDIUM
    - **Reason:** Map component showing listing locations

18. **`src/components/ui/ImageCarousel.tsx`**
    - **Category:** Interactive features
    - **Priority:** MEDIUM
    - **Reason:** Image carousel for listing photos

19. **`src/components/ui/VenueCard.tsx`**
    - **Category:** UI component
    - **Priority:** MEDIUM
    - **Reason:** Card component displaying venue information

20. **`src/components/listings/GalleryGrid.tsx`**
    - **Category:** UI component
    - **Priority:** MEDIUM
    - **Reason:** Gallery display for listing images

21. **`src/components/ui/form.tsx`**
    - **Category:** UI component
    - **Priority:** MEDIUM
    - **Reason:** Base form component used throughout application

22. **`src/components/ui/input.tsx`**
    - **Category:** UI component
    - **Priority:** MEDIUM
    - **Reason:** Base input component used in forms

23. **`src/components/ui/select.tsx`**
    - **Category:** UI component
    - **Priority:** MEDIUM
    - **Reason:** Select dropdown component

24. **`src/components/ui/checkbox.tsx`**
    - **Category:** UI component
    - **Priority:** MEDIUM
    - **Reason:** Checkbox component used in filters

25. **`src/components/ui/neo-button.tsx`**
    - **Category:** UI component
    - **Priority:** MEDIUM
    - **Reason:** Custom button component with neomorphic design

26. **`src/components/ui/neo-card.tsx`**
    - **Category:** UI component
    - **Priority:** MEDIUM
    - **Reason:** Custom card component with neomorphic design

#### ⚪ LOW Priority (12 components)
**Mock data files, utility components, and less frequently used UI elements**

27. `src/components/MswInit.tsx` - Mock Service Worker initialization
28. `src/components/city/cityDetailMockData.ts` - Mock data file (not testable in traditional sense)
29. `src/components/listings/listingDetailMockData.ts` - Mock data file (not testable in traditional sense)
30. `src/components/sections/featuredVenuesMockData.ts` - Mock data file (not testable in traditional sense)
31. `src/components/ui/Textarea.tsx` - Capitalized variant (may be duplicate)
32. `src/components/ui/city-carousel-wave.tsx` - Decorative animation component
33. `src/components/ui/demo.tsx` - Demo/example component
34. `src/components/ui/filter-multi-select.tsx` - Multi-select filter component
35. `src/components/ui/neo-input.tsx` - Neomorphic input variant
36. `src/components/ui/ruixen-carousel-wave.tsx` - Decorative animation component
37. `src/components/ui/scroll-down-arrow.tsx` - Scroll indicator component
38. `src/components/search/DigitalNomadSearchFilter.tsx` - May be duplicate/deprecated

### 2.4 Recommended Testing Priorities

Based on the analysis above, the following testing priorities are recommended:

#### Phase 1: Critical Components (Target: 100% coverage)
Focus on the 10 CRITICAL components first, particularly:
1. All search-related components (SearchBox, SearchForm, DigitalNomadSearch, FiltersSidebar, SearchFiltersForm)
2. FavoriteButton (user engagement)
3. Authentication components (SocialAuthRow)
4. Listing display components (ListingGrid, ListingDetailsCard, RelatedListings)

#### Phase 2: High Priority Components (Target: 80% coverage)
Address the 6 HIGH priority components:
1. Layout components (Footer, PageLayout)
2. Homepage sections (AboutSection, CategoryFilters, HeroSection, TestimonialsSection)

#### Phase 3: Medium Priority Components (Target: 60% coverage)
Test the 10 MEDIUM priority components:
1. Interactive UI features (InteractiveMap, ImageCarousel)
2. Common UI components (form, input, select, checkbox)
3. Card and display components

#### Phase 4: Low Priority Components (Target: 40% coverage)
Address remaining components as needed:
1. Mock data files (consider if testing is appropriate)
2. Decorative/animation components
3. Demo/example components

---

## Recommendations for Refactoring

### For External System Tests (Section 1):

1. **Sanity Tests:**
   - Verify if `src/__tests__/api/featured-listings/route.test.ts` actually connects to Sanity or uses mocks
   - Consider creating a test environment in Sanity or using mock data consistently
   - Standardize mocking approach across all Sanity tests

2. **MongoDB/Mongoose Tests:**
   - Consider migrating all integration tests to use MongoMemoryServer for consistency
   - Review the 22 tests without mocking to ensure they don't require actual MongoDB connection
   - Standardize model tests to use a consistent testing pattern
   - Consider separating unit tests from integration tests

3. **Redis Tests:**
   - Verify which tests actually require Redis connection vs. can use mocks
   - Consider using redis-mock or similar for consistent testing
   - Ensure rate limiting tests properly handle Redis unavailability

### For Component Coverage (Section 2):

1. **Immediate Actions:**
   - Create tests for CRITICAL priority components (10 components)
   - Establish testing patterns for search, authentication, and listing components
   - Document component testing conventions

2. **Short-term Actions:**
   - Add tests for HIGH priority layout and homepage components
   - Establish snapshot testing for visual components
   - Set up accessibility testing for interactive components

3. **Long-term Actions:**
   - Achieve minimum 60% component test coverage
   - Integrate component tests into CI/CD pipeline
   - Set up coverage gates to prevent regressions

---

## Appendix: Test Files Count by Category

### External System Tests Distribution
- **Sanity-related tests:** 7 files
- **MongoDB/Mongoose-related tests:** 26 files (including 1 with MongoMemoryServer)
- **Redis-related tests:** 11 files
- **Tests with mocking:** 17 files across all systems
- **Tests without mocking:** 27 files across all systems

### Component Test Coverage
- **Total component files:** 59
- **Components with tests:** 21 (35.6%)
- **Components needing tests:** 38 (64.4%)
- **Critical priority:** 10 components
- **High priority:** 6 components
- **Medium priority:** 10 components
- **Low priority:** 12 components

---

**Document Status:** Complete  
**Last Updated:** October 12, 2025  
**Next Steps:** Review findings with development team and prioritize refactoring backlog
