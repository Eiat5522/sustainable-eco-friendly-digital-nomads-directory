# Search Components Test Suite

## Quick Start

### Run All Tests
```bash
npm test -- src/components/search/__tests__/
```

### Run Specific Test File
```bash
# SearchBox tests
npm test -- SearchBox.test.tsx

# SearchForm tests
npm test -- SearchForm.unit.test.tsx

# DigitalNomadSearch tests
npm test -- DigitalNomadSearch.test.tsx

# FiltersSidebar tests
npm test -- FiltersSidebar.test.tsx

# SearchFiltersForm tests
npm test -- SearchFiltersForm.test.tsx
```

### Watch Mode (Development)
```bash
npm run test:watch -- src/components/search/__tests__/
```

### Coverage Report
```bash
npm run test:coverage -- src/components/search/__tests__/
```

## Test Files Overview

| File | Component | Complexity | Test Cases |
|------|-----------|------------|------------|
| SearchBox.test.tsx | SearchBox | Low | 25+ |
| SearchForm.unit.test.tsx | SearchForm | High | 40+ |
| DigitalNomadSearch.test.tsx | DigitalNomadSearch | Medium | 30+ |
| FiltersSidebar.test.tsx | FiltersSidebar | Medium | 35+ |
| SearchFiltersForm.test.tsx | SearchFiltersForm | High | 45+ |

## What's Tested

### ✅ User Interactions
- Typing in search inputs
- Selecting from dropdowns
- Clicking buttons
- Toggling checkboxes
- Keyboard navigation

### ✅ State Management
- Form state updates
- URL parameter synchronization
- Filter state management
- Loading/error states

### ✅ Accessibility
- ARIA labels and roles
- Screen reader support
- Keyboard navigation
- Semantic HTML

### ✅ API Integration
- Successful API calls
- Error handling
- Data transformation
- Abort signal cleanup

### ✅ Edge Cases
- Empty inputs
- Special characters
- Long text
- Rapid interactions
- Malformed data

## Test Structure

Each test file follows this pattern:

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    jest.clearAllMocks()
    // Configure mocks
  })

  describe('Rendering', () => {
    it('should render with proper elements', () => {
      // Test basic rendering
    })
  })

  describe('User Interactions', () => {
    it('should handle user input', async () => {
      // Test user interactions
    })
  })

  describe('Edge Cases', () => {
    it('should handle edge case', () => {
      // Test edge cases
    })
  })
})
```

## Mocking Strategy

### Navigation Mocks
```typescript
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))
```

### Custom Hook Mocks
```typescript
jest.mock('@/hooks/useSearchListings', () => ({
  useSearchListings: jest.fn(),
}))
```

### Component Mocks
```typescript
jest.mock('@/components/ui/neo-input', () => ({
  NeoInput: jest.fn((props) => <input {...props} />),
}))
```

## Common Patterns

### Testing User Input
```typescript
const user = userEvent.setup()
const input = screen.getByLabelText('Search')
await user.type(input, 'search query')
expect(input).toHaveValue('search query')
```

### Testing Button Clicks
```typescript
const user = userEvent.setup()
const button = screen.getByRole('button', { name: 'Search' })
await user.click(button)
expect(mockFunction).toHaveBeenCalled()
```

### Testing Async Updates
```typescript
await waitFor(() => {
  expect(screen.getByText('Results')).toBeInTheDocument()
})
```

### Testing Accessibility
```typescript
expect(screen.getByRole('search')).toHaveAttribute('aria-label', 'Search listings')
```

## Debugging Tests

### View Test Output
```bash
npm test -- --verbose src/components/search/__tests__/
```

### Debug Single Test
```typescript
it.only('should test specific case', () => {
  // Only this test will run
})
```

### Print Debug Info
```typescript
import { screen, render } from '@testing-library/react'

render(<Component />)
screen.debug() // Prints current DOM
```

## Coverage Goals

All tests target **85%+ coverage**:
- ✅ Statements
- ✅ Branches  
- ✅ Functions
- ✅ Lines

## Troubleshooting

### Tests Failing?

1. **Check Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Clear Jest Cache**
   ```bash
   npm test -- --clearCache
   ```

3. **Run Tests Individually**
   ```bash
   npm test -- SearchBox.test.tsx
   ```

### Common Issues

**Issue:** "Cannot find module '@/components/...'"
- **Solution:** Check `jest.config.cjs` moduleNameMapper

**Issue:** "act() warning"
- **Solution:** Ensure all async operations use `await waitFor()`

**Issue:** "Element not found"
- **Solution:** Use `screen.debug()` to inspect DOM

## Related Documentation

- [Test Summary](../../../../docs/testing/SEARCH_COMPONENTS_TEST_SUMMARY.md)
- [Test Refactoring Strategy](../../../../docs/testing/test_refactoring/tests_refactoring_strategy_plan.md)

## Contributing

When adding new tests:
1. Follow existing patterns
2. Test from user perspective
3. Include accessibility tests
4. Cover edge cases
5. Keep tests isolated
6. Use descriptive names

---

**Last Updated:** 2025-10-12  
**Coverage Target:** 85%+  
**Total Test Cases:** 175+
