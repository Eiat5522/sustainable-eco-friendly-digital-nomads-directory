# 🧪 Testing Guide - Authentication & E2E Testing

This document outlines the **comprehensive testing setup** for the Sustainable Digital Nomads Directory project, featuring military-grade authentication testing and full E2E coverage.

## ✅ **Authentication Testing - COMPLETED**

### **Test Coverage Summary**

- **120+ test cases** covering all authentication scenarios
- **Cross-browser testing** (Chromium, Firefox, WebKit)
- **Mobile responsive testing** with device emulation
- **Role-based access control** validation
- **API endpoint security** testing
- **Error handling** and edge case coverage

### **Test Suites**

#### 1. **Authentication Flow Tests** (`auth.spec.ts`)

- User registration with validation
- Login/logout functionality
- Password reset workflow
- Session persistence
- Multi-device login handling

#### 2. **Role-Based Access Control** (`rbac.spec.ts`)

- User role assignment and verification
- Permission-based route protection
- Admin dashboard access control
- Content moderation workflows

- API endpoint authorization

#### 3. **API Security Tests** (`auth-api.spec.ts`)

- Endpoint authentication validation
- Rate limiting verification
- Input sanitization testing
- CORS policy validation
- JWT token security

## 🚀 **Quick Start**

### Prerequisites

```bash
Node.js 18.17.0+ required
npm 9.6.7+ required
Playwright browsers installed
```

### Installation & Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Run test database setup (if needed)
npm run test:db-connection
```

## Test Structure

### Directory Structure

tests/
├── map-integration.spec.ts      # Map component integration tests
├── setup/
│   └── mock-data.ts            # Mock data and global setup
└── utils/
    ├── map-test-utils.ts       # Map-specific test helpers
    ├── filter-test-utils.ts    # Filter operation helpers
    ├── test-assertions.ts      # Common test assertions
    ├── test-fixtures.ts        # Test fixtures and data
    └── test-setup.ts          # Test environment setup helpers

### Test Utilities

#### Map Test Utils (`map-test-utils.ts`)

- `waitForMapLoad`: Waits for map and markers to be visible
- `getMapBounds`: Returns current map viewport bounds

- `panMap`: Pans map to specified coordinates
- `getVisibleMarkers`: Returns currently visible markers
- `clickMarkerByIndex`: Clicks marker at specified index
- `getPopupContent`: Gets content of active popup

#### Filter Test Utils (`filter-test-utils.ts`)

- `applyFilters`: Applies category and eco tag filters
- `clearFilters`: Clears all active filters

#### Test Assertions (`test-assertions.ts`)

- `expectLoading`: Checks loading state visibility
- `expectToastMessage`: Validates toast message content
- `expectEmptyState`: Verifies empty state display
- `expectValidImage`: Validates image loading

#### Test Setup (`test-setup.ts`)

- `setupMockApi`: Configures API mocking
- `setupViewport`: Sets viewport for different devices
- `setupLocalStorage`: Configures local storage state
- `clearLocalStorage`: Cleans up local storage
- `setupNetworkConditions`: Simulates network conditions

## Running Tests

### Commands

- `npm test`: Run all tests
- `npm run test:ui`: Run tests with UI mode
- `npm run test:debug`: Run tests in debug mode
- `npm run test:report`: View test reports

### Test Environment

Tests run against a local development server started automatically by Playwright. The environment uses:

- Mock API responses for consistent data
- Simulated network conditions
- Viewport sizes for desktop and mobile testing

## Writing Tests

### Best Practices

1. Use provided test utilities for common operations
2. Group related tests using `test.describe`
3. Use `test.beforeEach` for setup
4. Mock API responses using `setupMockApi`
5. Handle both success and error cases
6. Test responsive behavior using `setupViewport`

### Example Test

```typescript
test('should filter listings by category', async ({ page }) => {
  const initialCount = await page.locator('.marker-icon').count();
  await applyFilters(page, { categories: ['coworking'] });
  const markers = await getVisibleMarkers(page);
  expect(markers.length).toBeLessThan(initialCount);
});

```

### Mock Data

Mock data is provided via test fixtures in `test-fixtures.ts`. To use mock data:

```typescript
test('example test', async ({ page, mockListings }) => {
  await setupMockApi(page, mockListings);
  // Test implementation
});
```

## CI/CD Integration

Tests run automatically on:

- Pull request creation/updates
- Push to main branch
- Manual trigger

### Pipeline Configuration

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
```

## Troubleshooting

### Common Issues

1. **Tests failing on CI but passing locally**
   - Check viewport sizes
   - Verify network timeouts
   - Ensure mock data is consistent

2. **Flaky Tests**
   - Use proper wait conditions instead of timeouts
   - Check for race conditions
   - Verify element selectors

3. **Browser Compatibility**
   - Test across all configured browsers
   - Use vendor prefixes in CSS
   - Check for browser-specific behavior

### Debug Tips

1. Use `test:debug` command for step-by-step debugging
2. Enable video recording: `playwright.config.ts`
3. Check test artifacts in `test-results/` directory
4. Use `console.log` with `page.evaluate()`
