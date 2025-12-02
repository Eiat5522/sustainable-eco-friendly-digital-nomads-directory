# Client-Side Navigation Mocking Implementation Guide

## Overview

This document describes the implementation of **Section 3.1: Mocking Client-Side Navigation** from the Advanced Mocking Strategies guide. The implementation provides two approaches for mocking Next.js navigation hooks:

1. **Global jest.fn() mocks** (default) - For backward compatibility with existing tests
2. **next-router-mock** (opt-in) - For realistic router behavior in new tests

---

## What Was Implemented

### 1. Global Mock Configuration (Default)

**File**: `jest.setup.ts`

The global mock uses `jest.fn()` for backward compatibility with existing tests:

```typescript
jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    // ... other methods
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  useParams: jest.fn(() => ({})),
  notFound: jest.fn(() => { throw new Error('NEXT_NOT_FOUND'); }),
  redirect: jest.fn(() => { throw new Error('NEXT_REDIRECT'); }),
}));
```

This allows existing tests to use `.mockReturnValue()` without changes.

### 2. next-router-mock (Opt-In for New Tests)

**Package**: `next-router-mock@^1.0.4`

For tests that need more realistic router behavior, you can opt-in by adding this to your test file:

```typescript
// At the top of your test file
jest.mock('next/navigation', () => jest.requireActual('next-router-mock/navigation'));
```

This provides:
- In-memory URL state management
- Realistic router behavior
- Programmatic control via `mockRouter` API

---

## How to Use

### Approach 1: Default jest.fn() Mocks (Existing Tests)

This is the default behavior. Tests can override mocks as needed:

```typescript
import { useRouter } from 'next/navigation';

describe('Your Component', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      // ... other methods
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should navigate on click', () => {
    render(<YourComponent />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});
```

### Approach 2: next-router-mock (Recommended for New Tests)

For more realistic router behavior, opt-in at the file level:

```typescript
import mockRouter from 'next-router-mock';

// Override global mock for this file only
jest.mock('next/navigation', () => jest.requireActual('next-router-mock/navigation'));

describe('Your Component', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/your/path');
  });

  afterEach(() => {
    mockRouter.setCurrentUrl('/');
  });

  it('should work with navigation hooks', () => {
    render(<YourComponent />);
    // Component uses real router behavior
  });
});
```

---

## next-router-mock Patterns

### Pattern 1: Testing with `usePathname`

```typescript
import { usePathname } from 'next/navigation';
import mockRouter from 'next-router-mock';

describe('Component with usePathname', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/users/profile');
  });

  afterEach(() => {
    mockRouter.setCurrentUrl('/');
  });

  it('should display the current path', () => {
    render(<YourComponent />);
    // Component will see pathname as '/users/profile'
  });
});
```

### Pattern 2: Testing with `useSearchParams`

```typescript
import { useSearchParams } from 'next/navigation';
import mockRouter from 'next-router-mock';

describe('Component with useSearchParams', () => {
  beforeEach(() => {
    // Set URL with query parameters
    mockRouter.setCurrentUrl('/search?q=test%20query&filter=active');
  });

  it('should access search parameters', () => {
    render(<YourComponent />);
    // Component will see searchParams.get('q') === 'test query'
    // Component will see searchParams.get('filter') === 'active'
  });
});
```

### Pattern 3: Testing with `useRouter` (Navigation)

```typescript
import { useRouter } from 'next/navigation';
import mockRouter from 'next-router-mock';

describe('Component with useRouter', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/');
  });

  it('should navigate when action is triggered', () => {
    render(<YourComponent />);
    
    // Trigger navigation in your component
    fireEvent.click(screen.getByRole('button'));
    
    // Assert that navigation occurred
    expect(mockRouter).toMatchObject({
      pathname: '/dashboard',
      asPath: '/dashboard',
    });
  });
});
```

### Pattern 4: Testing with `useParams` (Dynamic Routes)

For dynamic routes, you can use `MemoryRouterProvider`:

```typescript
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider';

it('should access route parameters', () => {
  render(
    <MemoryRouterProvider url="/users/123">
      <YourComponent />
    </MemoryRouterProvider>
  );
  // Component will see params.userId === '123'
});
```

### Pattern 5: Testing Complex Router State

```typescript
it('should handle complex URL with query and hash', () => {
  mockRouter.setCurrentUrl('/products?category=electronics&sort=price#reviews');
  
  expect(mockRouter).toMatchObject({
    pathname: '/products',
    asPath: '/products?category=electronics&sort=price#reviews',
    query: {
      category: 'electronics',
      sort: 'price',
    },
  });
});
```

---

## Test Isolation Best Practices

### ⚠️ CRITICAL: Always Clean Up After Each Test

```typescript
describe('Your Test Suite', () => {
  beforeEach(() => {
    // Set initial state
    mockRouter.setCurrentUrl('/your/path');
  });

  afterEach(() => {
    // ESSENTIAL: Reset state to prevent leakage
    mockRouter.setCurrentUrl('/');
  });

  it('test case', () => {
    // Your test
  });
});
```

**Why This Matters**:
- Prevents state from one test affecting another
- Ensures tests run independently
- Eliminates flaky, order-dependent tests
- Makes debugging easier when tests fail

---

## Supported Hooks

✅ **Fully Supported**:
- `useRouter()` - Router navigation and state
- `usePathname()` - Current pathname
- `useParams()` - Dynamic route parameters (with MemoryRouterProvider)
- `useSearchParams()` - Query string parameters

❌ **Not Yet Supported**:
- `useSelectedLayoutSegment()`
- `useSelectedLayoutSegments()`
- Non-hook utilities from `next/navigation`

---

## Example Test File

A complete working example is available at:
```
src/__tests__/examples/client-side-navigation-mock.example.test.tsx
```

This file demonstrates:
- Setting up router state
- Testing all navigation hooks
- Proper cleanup patterns
- Complex routing scenarios
- Best practices for test isolation

---

## Migration Guide

### When to Use Each Approach

**Use Default jest.fn() Mocks When**:
- Working with existing tests (no changes needed)
- Simple navigation testing (just checking if push was called)
- Need to mock specific return values per test

**Use next-router-mock When**:
- Testing complex routing logic
- Need realistic URL state management
- Testing components that depend on multiple navigation hooks
- Want to verify actual router state changes

### Migrating Existing Tests (Optional)

If you want to migrate an existing test to use next-router-mock:

#### Before (jest.fn() mocks):
```typescript
describe('Your Component', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('should navigate', () => {
    render(<Component />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});
```

#### After (next-router-mock):
```typescript
// Add at top of file
jest.mock('next/navigation', () => jest.requireActual('next-router-mock/navigation'));

describe('Your Component', () => {
  beforeEach(() => {
    mockRouter.setCurrentUrl('/');
  });

  it('should navigate', () => {
    render(<Component />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockRouter).toMatchObject({
      pathname: '/dashboard',
    });
  });
});
```

---

## Troubleshooting

### Issue: Router state persists between tests

**Solution**: Ensure you have `afterEach` cleanup:
```typescript
afterEach(() => {
  mockRouter.setCurrentUrl('/');
});
```

### Issue: `useParams()` returns empty object

**Solution**: Use `MemoryRouterProvider` wrapper:
```typescript
render(
  <MemoryRouterProvider url="/users/123">
    <YourComponent />
  </MemoryRouterProvider>
);
```

### Issue: Tests fail with "not a function" errors

**Solution**: Verify the global mock is in `jest.setup.ts`:
```typescript
jest.mock('next/navigation', () => require('next-router-mock/navigation'));
```

---

## References

- **Documentation Guide**: `docs/app-next-directory/ADVANCE_MOCKING_STRATEGIES_FOR_NEXTJS_APPLICATION_WITH_JEST.md` (Section 3.1)
- **Example Tests**: `src/__tests__/examples/client-side-navigation-mock.example.test.tsx`
- **Package**: [next-router-mock on npm](https://www.npmjs.com/package/next-router-mock)
- **Global Setup**: `jest.setup.ts` (lines 536-539)

---

## Summary

✅ **Implemented**:
- Global `next/navigation` mock using `next-router-mock`
- Example tests demonstrating all patterns
- Comprehensive documentation

✅ **Benefits**:
- Predictable, stable router behavior in tests
- No manual mock configuration needed per test
- Supports all major navigation hooks
- Better test isolation and reliability

✅ **Next Steps**:
- Use these patterns in your component tests
- Refer to example file for advanced scenarios
- Maintain proper cleanup in `afterEach` blocks
