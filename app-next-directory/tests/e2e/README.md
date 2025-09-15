# ReviewsSection E2E Tests

This directory contains comprehensive end-to-end tests for the ReviewsSection component covering authentication flows and review submission behavior.

## Test Files

- `reviews.spec.ts` - Isolated component tests using mocked HTML
- `reviews-real.spec.ts` - Integration tests using actual ReviewsSection component via `/test-reviews` page

## Test Coverage

### 1. Non-authenticated User Flow
- **Sign-in prompt display**: Validates that unauthenticated users see the sign-in prompt
- **Callback URL generation**: Tests client-side `callbackUrl` capture using `window.location.href`
- **Navigation to login**: Verifies clicking "Sign In" navigates to `/auth/login?callbackUrl=...`

### 2. Authenticated User Review Submission
- **401 Unauthorized handling**: Tests session expiration scenario where API returns 401
- **Redirect to login with callback**: Verifies 401 responses trigger redirect to login with preserved `callbackUrl`
- **Successful submission**: Tests 200 response handling with success message and form reset

### 3. Form Validation
- **Submit button states**: Tests disabled/enabled states based on rating and comment presence
- **Required field validation**: Ensures both rating and comment are required before submission

## Key Testing Features

### Network Request Mocking
```typescript
// Mock unauthenticated session
await page.route('**/api/auth/session', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({}) // Empty = unauthenticated
  });
});

// Mock review submission returning 401
await page.route('**/api/reviews', async (route) => {
  if (route.request().method() === 'POST') {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Unauthorized' })
    });
  }
});
```

### Client-side Behavior Testing
The tests validate the component's client-side behavior including:
- `useEffect` hook that captures `window.location.href` for `callbackUrl`
- React state management for form fields and submission states
- Navigation handling using Next.js `useRouter`

## Running the Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Run Tests
```bash
# Run all review tests
npm run test:e2e -- tests/e2e/reviews*.spec.ts

# Run specific test file
npm run test:e2e -- tests/e2e/reviews.spec.ts

# Run with UI for debugging
npm run test:e2e -- tests/e2e/reviews.spec.ts --ui

# Run in headed mode to see browser
npm run test:e2e -- tests/e2e/reviews.spec.ts --headed
```

### Test Page
The tests use a dedicated test page at `/test-reviews` that renders the ReviewsSection component in isolation. This page is created specifically for testing and includes:
- Mock review data (empty array)
- Test listing ID
- Configurable authentication state

## CI/CD Integration

The tests are designed to run reliably in CI environments with:
- Network isolation using `page.route()` mocking
- Configurable timeouts for slow environments
- Retry logic for flaky network conditions
- Screenshot/video capture on failures

## Test Implementation Notes

### Callback URL Testing
The tests validate the specific client-side behavior where:
1. Component uses `useEffect` to capture `window.location.href`
2. This URL is stored in component state as `callbackUrl`
3. Sign-in links and 401 redirects use this captured URL

### API Mocking Strategy
- **Authentication**: Mock `/api/auth/session` to control user state
- **Reviews**: Mock `/api/reviews` POST to test different response scenarios
- **Login Pages**: Mock `/auth/login` to prevent 404 errors during redirects

### Component Integration
The tests work with the actual ReviewsSection component including:
- StarRating component interaction
- NeoButton component behavior
- Textarea validation
- Error/success message display

This ensures tests validate real component behavior rather than just mocked implementations.