# E2E vs Unit Testing Strategy for Search Functionality

## Problem Identified

The original `tests/e2e/ux/search.test.ts` had inconsistent testing approach:
- **Location**: E2E test directory (`tests/e2e/ux/`)
- **Expectation**: Mocked behavior (comment: "Sanity mock returns [] by default")
- **Reality**: Making real HTTP requests to live APIs
- **Risk**: Unpredictable failures due to changing live data

## Solutions Implemented

### Solution 1: Proper E2E Testing with Controlled Environment

**File**: `tests/e2e/ux/search.test.ts` (Updated)

**Approach**:
- Use Playwright's `page.route()` to mock API responses
- Provide controlled, predictable test data
- Test actual user interactions and workflows
- Verify end-to-end functionality with known data states

**Benefits**:
- Tests real user workflows
- Predictable test results
- No dependency on live data
- Tests actual network requests and responses

**Example**:
```typescript
test('search with filters shows correct results', async ({ page }) => {
  // Mock API responses for predictable testing
  await page.route('/api/listings*', async route => {
    await route.fulfill({
      json: {
        data: [
          {
            id: 'test-listing-1',
            title: 'Eco Coworking Bangkok',
            category: 'coworking',
            city: 'Bangkok',
            ecoTags: ['solar-powered', 'green-building'],
            sustainabilityScore: 85
          }
        ],
        totalCount: 1,
        hasMore: false
      }
    });
  });

  // Test actual user interactions...
  await page.getByRole('button', { name: 'Filters' }).click();
  await page.selectOption('select[name="category"]', 'coworking');
  // ... rest of test
});
```

### Solution 2: Unit Testing with Proper Mocking

**File**: `src/components/search/__tests__/SearchForm.unit.test.tsx` (New)

**Approach**:
- Mock all external dependencies (hooks, API calls, routing)
- Test component logic in isolation
- Fast execution
- Predictable, controlled state

**Benefits**:
- Fast test execution
- Isolated component testing
- Easy to test edge cases
- No network dependencies

**Example**:
```typescript
jest.mock('@/hooks/useSearchListings', () => ({
  useSearchListings: jest.fn(),
}));

test('displays search results with controlled data', () => {
  const mockListings = [
    {
      id: 'test-1',
      title: 'Eco Coworking Space',
      category: 'coworking',
      // ... controlled test data
    }
  ];

  mockUseSearchListings.mockReturnValue({
    listings: mockListings,
    loading: false,
    error: null,
    // ... controlled state
  });

  render(<SearchForm />);
  // ... assertions
});
```

## When to Use Each Approach

### Use E2E Tests For:
- **User Workflows**: Complete user journeys from start to finish
- **Integration Points**: Testing how components work together
- **Visual/UX Testing**: Layout, responsiveness, accessibility
- **Network Behavior**: Loading states, error handling
- **Browser Compatibility**: Cross-browser functionality

### Use Unit Tests For:
- **Component Logic**: Individual component behavior
- **State Management**: Hook and state logic
- **Edge Cases**: Error conditions, boundary cases
- **Fast Feedback**: During development
- **Code Coverage**: Detailed function coverage

## Test Environment Requirements

### For E2E Tests:
```typescript
// Set up controlled test environment
test.beforeEach(async ({ page }) => {
  await page.goto('/?testMode=true');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-test-mode="true"]')).toBeVisible();
});
```

### For Unit Tests:
```typescript
// Mock all external dependencies
jest.mock('next/navigation');
jest.mock('@/hooks/useSearchListings');
jest.mock('@/lib/api');
```

## Recommendations

1. **E2E Tests Should**:
   - Mock API responses for predictable data
   - Test complete user workflows
   - Focus on integration and UX
   - Use controlled test environments

2. **Unit Tests Should**:
   - Mock all external dependencies
   - Test component logic in isolation
   - Cover edge cases and error states
   - Provide fast feedback during development

3. **Avoid**:
   - E2E tests that depend on live, changing data
   - Unit tests that make real network requests
   - Mixed expectations (e2e location with unit test behavior)

## File Organization

```
app-next-directory/
├── src/
│   └── components/
│       └── search/
│           ├── SearchForm.tsx
│           └── __tests__/
│               └── SearchForm.unit.test.tsx     # Unit tests
└── tests/
    └── e2e/
        └── ux/
            └── search.test.ts                    # E2E tests
```

This separation ensures:
- Clear testing strategy
- Predictable test results
- Fast unit test feedback
- Comprehensive e2e coverage
- No conflicts between test approaches