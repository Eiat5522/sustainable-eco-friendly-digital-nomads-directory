# 🎭 Playwright Testing Setup

## 📋 Overview
This document provides a comprehensive guide to the Playwright testing setup for the Sustainable Eco-Friendly Digital Nomads Directory project. Our test suite focuses on ensuring the reliability and functionality of key features, with special emphasis on map integration and listing management.

## 🧪 Test Organization

### Test Runners & Directory Structure
This project uses **two different test runners** for different types of tests:

1. **Playwright** - For E2E (end-to-end) UI tests only
   - Location: `tests/e2e/`
   - File pattern: `*.spec.ts`
   - Command: `pnpm test:e2e`
   - Purpose: Full browser-based UI testing

2. **Jest** - For Unit and Integration tests
   - Unit tests: `src/**/*.test.ts`
   - Integration tests: `src/**/*.integration.test.ts`
   - Commands: `pnpm test:unit`, `pnpm test:integration`
   - Purpose: Fast, isolated unit and integration testing

### ⚠️ Important: Spec File Location
**CRITICAL**: Only `.spec.ts` files in the `tests/e2e/` directory should be run by Playwright. 

Spec files in `tests/` root directory (like `tests/api-integration.spec.ts`, `tests/map-integration.spec.ts`) are **integration tests** that should eventually be migrated to use Jest's `.test.ts` naming convention. They are currently excluded from Playwright runs via the config.

## 📁 Folder Structure
```
tests/
├── e2e/                          # ✅ Playwright E2E tests (UI testing)
│   ├── auth.spec.ts              # Authentication flows
│   ├── listing-detail.spec.ts    # Listing detail page
│   ├── filters/                  # Filter functionality
│   └── ...
├── api-integration.spec.ts       # ⚠️  Integration test (NOT run by Playwright)
├── map-integration.spec.ts       # ⚠️  Integration test (NOT run by Playwright)
├── preview-*.spec.ts             # ⚠️  Integration tests (NOT run by Playwright)
└── utils/                        # Shared test utilities
    ├── map-test-utils.ts
    └── ...
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 20+ (as specified in package.json)
- pnpm (preferred package manager)

### Installation
```bash
# Install Playwright and its dependencies
pnpm install
pnpm install:playwright

# Or install manually
pnpm exec playwright install --with-deps
```

### Running Tests
```bash
# Run all E2E tests (Playwright)
pnpm test:e2e

# List all E2E tests without running them
pnpm test:e2e:list

# Run specific test file
pnpm test:e2e -- tests/e2e/auth.spec.ts

# Run unit tests (Jest)
pnpm test:unit

# Run integration tests (Jest)
pnpm test:integration
```

### Test Fixtures
We use custom fixtures to provide common test setup and teardown:

```typescript
import { test as base } from '@playwright/test';

export const test = base.extend({
  // Mock listings data fixture
  mockListings: async ({}, use) => {
    const listings = getMockListings();
    await use(listings);
  },
  // Additional fixtures...
});
```

### API Mocking
Tests use mock API responses to ensure consistent behavior:

```typescript
await setupMockApi(page, mockListings);
```

### Map Testing Utilities
Common map operations are abstracted into utility functions:
- `waitForMapLoad()`: Ensures map is fully loaded
- `getMapBounds()`: Retrieves current map boundaries
- `panMap()`: Simulates map panning
- `zoomMap()`: Controls map zoom level

## 🎯 Test Categories

### Geocoding Utility Tests (`src/lib/__tests__/geocode.test.ts`)
- Functionality of `findLandmarkCoordinates`
- Functionality of `geocodeAddress`
- Handling of various input formats (string, null, undefined)
- Handling of different API response structures ({lat, lon}, {latitude, longitude}, array, empty array)
- Error handling and fallback logic (landmark, full address fetch, city landmark, city fetch)
- Ensures all tests pass after recent fixes

### Map Integration Tests
- Map initialization and loading
- Marker clustering behavior
- Filter interactions
- Mobile responsiveness
- Empty states and error handling

### API Integration Tests
- Listings data fetching
- Search and filtering requests
- Error handling and fallbacks

## 💡 Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mock Data**: Use consistent mock data from `mock-data.ts`
3. **Cleanup**: Clean up any test data or state after each test
4. **Mobile Testing**: Include mobile viewport tests for critical features
5. **Error States**: Test both success and error scenarios

## 🔄 Continuous Integration

Tests run automatically on:
- Pull request creation/updates
- Merges to main branch
- Manual trigger via GitHub Actions

## 🤝 Contributing

1. Ensure tests pass locally before pushing
2. Add tests for new features
3. Update documentation for significant test changes
4. Follow existing patterns for consistency

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Test Utilities Documentation](./utils/README.md)
- [API Mocking Guide](./setup/API-MOCKING.md)
