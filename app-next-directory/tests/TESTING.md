# 🎭 Playwright Testing Setup

## 📋 Overview
This document provides a comprehensive guide to the Playwright testing setup for the Sustainable Eco-Friendly Digital Nomads Directory project. Our test suite focuses on ensuring the reliability and functionality of key features, with special emphasis on map integration and listing management.

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 16+
- npm or pnpm

### Installation
```bash
# Install Playwright and its dependencies
npm install -D @playwright/test
npx playwright install --with-deps
```

### Running Tests
```bash
# Run all tests
npm run test:e2e

# Run specific test file
npm run test:e2e tests/map-integration.spec.ts

# Run tests in debug mode
npm run test:debug
```

## 📁 Folder Structure
```
tests/
├── map-integration.spec.ts     # Map component integration tests
├── setup/
│   └── mock-data.ts           # Test data and mock configurations
└── utils/
    ├── map-test-utils.ts      # Map-specific test helpers
    ├── filter-test-utils.ts   # Filtering functionality helpers
    ├── test-assertions.ts     # Common test assertions
    ├── test-fixtures.ts       # Test fixtures and setup
    └── test-setup.ts          # Global test setup utilities
```

## 🔑 Key Concepts

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
