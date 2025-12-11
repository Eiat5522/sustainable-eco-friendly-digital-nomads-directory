# Test Reliability Guide

## Overview

This guide addresses common test reliability issues in this Next.js project and provides solutions for:
- Flaky tests in VS Code
- Memory leak false positives
- Consistent test execution across environments

## Quick Reference

### Running Tests Reliably

```bash
# ✅ Recommended: Run all unit tests
pnpm test:unit

# ✅ Run specific test file
pnpm jest path/to/test.tsx

# ✅ Watch mode for development
pnpm test:watch

# ✅ With coverage
pnpm test:unit:coverage

# ❌ Don't use --detectLeaks (false positives)
# ❌ Don't rely on VS Code Test Explorer (flaky)
```

### Test Environment

- **Terminal**: Reliable, fast, full control ✅
- **VS Code Test Explorer**: Convenient but flaky ⚠️
- **--detectLeaks flag**: Not compatible with this setup ❌

## Key Documents

### 1. [Jest Memory Leak Detection](./JEST_MEMORY_LEAK_DETECTION.md)

Learn about:
- Why `--detectLeaks` produces false positives
- How to prevent actual memory leaks
- Best practices for test cleanup
- Monitoring real memory issues

### 2. [VS Code Test Flakiness](./VSCODE_TEST_FLAKINESS.md)

Learn about:
- Why VS Code Test Explorer is unreliable
- How to configure VS Code properly
- Alternative testing workflows
- Debugging flaky tests

## Problem Summary

### Issue 1: Tests Fail with `--detectLeaks`

**Symptom**: 47-49 test suites fail when running with `--detectLeaks` flag.

**Root Cause**: False positives from Next.js/Jest/React Testing Library setup holding module-level references.

**Solution**: Don't use `--detectLeaks`. Focus on real cleanup (see [JEST_MEMORY_LEAK_DETECTION.md](./JEST_MEMORY_LEAK_DETECTION.md)).

### Issue 2: Flaky Tests in VS Code

**Symptom**: Tests pass in Windows terminal but fail intermittently in VS Code.

**Root Cause**: VS Code Test Explorer runs tests differently than CLI, causing race conditions and timing issues.

**Solution**: Use terminal instead (see [VSCODE_TEST_FLAKINESS.md](./VSCODE_TEST_FLAKINESS.md)).

## Improvements Made

### jest.setup.ts Enhancements

```typescript
// Automatic cleanup after each test
afterEach(async () => {
  cleanup(); // React Testing Library
  jest.clearAllTimers(); // Clear timers
  jest.clearAllMocks(); // Release mock references
  
  // Clean up BroadcastChannel instances
  // ... cleanup code ...
  
  // Run GC if available
  if (global.gc) {
    global.gc();
  }
  
  // Flush promises
  await new Promise(resolve => setTimeout(resolve, 0));
});
```

### jest.config.cjs Improvements

```javascript
{
  // Disable fake timers to avoid leaks
  fakeTimers: { enableGlobally: false },
  
  // Serial execution for consistency
  maxWorkers: 1,
  
  // Reasonable timeout
  testTimeout: 10000,
}
```

### BroadcastChannel Mock Enhancement

```typescript
// Instance tracking for cleanup
const instances: Set<BroadcastChannel> = new Set();

class BroadcastChannel {
  constructor(name: string) {
    instances.add(this);
  }
  
  close(): void {
    this.#listeners.clear();
    this.#onmessageHandler = null;
    instances.delete(this);
  }
}

// Cleanup function
BroadcastChannel.__cleanup = () => {
  for (const instance of instances) {
    instance.close();
  }
  instances.clear();
};
```

### MSW Server Refactoring

```typescript
// Explicit instance tracking instead of promise
let serverInstance = null;

afterAll(async () => {
  if (serverInstance) {
    serverInstance.close();
    await new Promise(resolve => setTimeout(resolve, 0));
    serverInstance = null;
  }
});
```

## Writing Reliable Tests

### Template for New Tests

```typescript
import { render, cleanup } from '@testing-library/react';

describe('MyComponent', () => {
  // Cleanup is automatic via jest.setup.ts
  
  it('should render', () => {
    const { container } = render(<MyComponent />);
    expect(container).toBeInTheDocument();
  });
  
  it('should handle async', async () => {
    // Always await async operations
    await someAsyncOperation();
    expect(result).toBe(expected);
  });
});
```

### Cleanup Checklist

For each test, ensure:
- [ ] All async operations are awaited
- [ ] Timers are cleared or mocked
- [ ] Event listeners are removed
- [ ] No global state modifications
- [ ] Mocks are cleared (automatic)
- [ ] Components are cleaned up (automatic)

## Monitoring Test Health

### Watch for Warning Signs

1. **Test Timeouts**: Tests hanging or timing out
2. **OOM Errors**: "JavaScript heap out of memory"
3. **Slow Tests**: Tests getting progressively slower
4. **Flaky Failures**: Tests failing intermittently

### Debugging Commands

```bash
# Check memory usage
pnpm test:unit --logHeapUsage

# Run with detailed output
pnpm test:unit --verbose

# Run single test to isolate
pnpm jest path/to/test.tsx --verbose

# Run with garbage collection
NODE_OPTIONS="--expose-gc" pnpm test:unit
```

## Environment-Specific Issues

### Terminal (Reliable) ✅
```bash
# Consistent behavior
pnpm test:unit
```

### VS Code (Flaky) ⚠️
```bash
# May have different behavior
# Use terminal instead
```

### CI/CD (Reliable) ✅
```bash
# Configured for consistency
pnpm test:ci
```

## FAQ

### Q: Why don't we use `--detectLeaks`?

**A**: It produces false positives with our Next.js/Jest/RTL setup. We focus on real cleanup instead.

### Q: Why are tests flaky in VS Code?

**A**: VS Code Test Explorer runs tests differently than the CLI. Use terminal for reliability.

### Q: How do I know if there's a real memory leak?

**A**: Look for timeouts, OOM errors, or progressively slower tests. Use `--logHeapUsage` to monitor.

### Q: Should I fix VS Code test failures?

**A**: Only if they also fail in terminal. VS Code-only failures are typically environment issues.

### Q: Can I use `jest.useFakeTimers()`?

**A**: Yes, but call `jest.useRealTimers()` in `afterEach` or `afterAll` to clean up.

### Q: What about integration tests?

**A**: Use `pnpm test:integration` which has different configuration for real MongoDB.

## Best Practices Summary

### DO ✅
- Run tests in terminal
- Use `pnpm test:unit` command
- Await all async operations
- Clear timers and listeners
- Write isolated tests
- Monitor test execution time
- Check for real memory issues

### DON'T ❌
- Use `--detectLeaks` flag
- Rely on VS Code Test Explorer
- Leave async operations unresolved
- Create global state
- Ignore test timeouts
- Add unnecessary complexity

## Getting Help

If you encounter test issues:

1. Check if it reproduces in terminal
2. Review this guide and related docs
3. Check test execution time with `--logHeapUsage`
4. Isolate the test to identify the issue
5. Add proper cleanup if needed
6. Ask for help with specific error messages

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [MSW Documentation](https://mswjs.io/docs/)
