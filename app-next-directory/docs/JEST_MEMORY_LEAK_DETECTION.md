# Jest Memory Leak Detection

## Overview

This document explains why the `--detectLeaks` flag is not used in this project's test suite and provides guidelines for preventing actual memory leaks.

## Why `--detectLeaks` is Not Used

Jest's `--detectLeaks` flag uses V8 heap snapshots to detect memory leaks between test runs. While this sounds ideal, it has significant limitations with complex modern setups:

### Known Issues with `--detectLeaks`

1. **False Positives with Next.js**: The `next/jest` configuration creates complex module transformations and mocks that hold module-level references, which Jest incorrectly identifies as leaks.

2. **Module Caching**: Jest's module caching system intentionally holds references to loaded modules, which the leak detector treats as leaks.

3. **React Testing Library**: RTL maintains internal state that persists across tests by design, triggering false positives.

4. **Third-party Libraries**: Many libraries (MSW, Radix UI, etc.) use module-level singletons that the leak detector flags.

### Investigation Results

Extensive testing showed that even with:
- Minimal test setup
- MSW disabled
- Explicit garbage collection (`--expose-gc`)
- All cleanup hooks in place

The `--detectLeaks` flag still reported leaks for simple tests with no actual memory issues.

## Actual Memory Leak Prevention

Instead of relying on `--detectLeaks`, this project uses these proven strategies:

### 1. Automatic Cleanup (jest.setup.ts)

```typescript
afterEach(async () => {
  cleanup(); // React Testing Library cleanup
  jest.clearAllTimers(); // Clear timers
  jest.clearAllMocks(); // Release mock references
  // ... additional cleanup
});
```

### 2. Real Sources of Memory Leaks

Focus on preventing these actual issues:

#### Timers
```typescript
// ❌ Bad - timer leaks
setTimeout(() => {}, 1000);

// ✅ Good - clean up timers
const timer = setTimeout(() => {}, 1000);
afterEach(() => clearTimeout(timer));

// ✅ Better - use jest's timer mocks
jest.useFakeTimers();
// ... test code ...
jest.runAllTimers();
jest.useRealTimers();
```

#### Event Listeners
```typescript
// ❌ Bad - listener leaks
window.addEventListener('resize', handler);

// ✅ Good - remove listeners
const handler = () => {};
window.addEventListener('resize', handler);
afterEach(() => window.removeEventListener('resize', handler));
```

#### Async Operations
```typescript
// ❌ Bad - unresolved promise
it('test', async () => {
  fetch('/api/data'); // Not awaited!
});

// ✅ Good - await all async operations
it('test', async () => {
  await fetch('/api/data');
});
```

#### Component Cleanup
```typescript
// ✅ Always use cleanup (automatic in jest.setup.ts)
import { render, cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

### 3. Identifying Real Memory Leaks

Watch for these symptoms:

1. **Test timeouts**: Tests that hang or timeout
2. **OOM errors**: "JavaScript heap out of memory" errors
3. **Slow test suites**: Tests that get progressively slower
4. **High memory usage**: Check with `--logHeapUsage`

### 4. Best Practices for Test Authors

#### ✅ DO:
- Use `cleanup()` from React Testing Library (automatic)
- Clear timers and intervals in `afterEach`
- Remove event listeners in `afterEach`
- Await all async operations
- Mock external services (fetch, timers, etc.)
- Use `jest.clearAllMocks()` (automatic)

#### ❌ DON'T:
- Create global variables in tests
- Leave timers/intervals running
- Forget to await promises
- Keep references to DOM nodes
- Use `--detectLeaks` flag (false positives)

## Monitoring Memory

### During Development

```bash
# Monitor heap usage
pnpm test:unit --logHeapUsage

# Run specific test to check for issues
pnpm jest path/to/test.tsx --logHeapUsage
```

### In CI/CD

- Monitor test suite execution time trends
- Watch for OOM errors
- Check for test timeouts

## Configuration

### jest.config.cjs

```javascript
{
  // Disable fake timers by default to avoid leaks
  fakeTimers: {
    enableGlobally: false,
  },
  
  // Serial execution for consistency
  maxWorkers: 1,
  
  // Reasonable timeout
  testTimeout: 10000,
}
```

### jest.setup.ts

```typescript
// Comprehensive cleanup
afterEach(async () => {
  cleanup();
  jest.clearAllTimers();
  jest.clearAllMocks();
  
  // Garbage collection if --expose-gc is used
  if (global.gc) {
    global.gc();
  }
  
  // Flush promises
  await new Promise(resolve => setTimeout(resolve, 0));
});
```

## FAQ

### Q: Why do tests fail with `--detectLeaks` but pass normally?

A: The `--detectLeaks` flag has false positives with Next.js/Jest/RTL setups. The tests are not actually leaking memory; Jest's detection is overly sensitive to module-level references that are intentional.

### Q: How do I know if I have a real memory leak?

A: Look for: test timeouts, OOM errors, progressively slower tests, or high memory usage with `--logHeapUsage`.

### Q: Should I ever use `--detectLeaks`?

A: Only in very simple, isolated test scenarios. Not for the full test suite with Next.js.

### Q: What if I see increasing memory usage?

A: Check for:
1. Timers not being cleared
2. Event listeners not removed
3. Promises not awaited
4. References held in closures

## References

- [Jest Leak Detection Issues](https://github.com/facebook/jest/issues?q=detectLeaks)
- [Next.js Testing Docs](https://nextjs.org/docs/testing)
- [React Testing Library Cleanup](https://testing-library.com/docs/react-testing-library/api#cleanup)
