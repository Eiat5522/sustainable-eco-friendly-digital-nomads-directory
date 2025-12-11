# VS Code Test Flakiness Issues

## Problem

When running Jest tests in VS Code's integrated test runner, you may experience:
- Intermittent test failures
- Tests that pass in terminal but fail in VS Code
- Inconsistent results across runs

## Root Causes

### 1. VS Code Test Runner Limitations

VS Code's Jest extension runs tests differently than the command line:
- Uses a separate Node.js process
- May not respect all Jest configuration options
- Handles worker processes differently
- May have different environment variables

### 2. Worker Process Issues

VS Code's test runner may:
- Use different worker allocation strategies
- Not respect `--runInBand` / `maxWorkers: 1` settings
- Have race conditions between parallel test workers
- Handle cleanup differently than CLI

### 3. Environment Differences

- VS Code may set different `NODE_ENV` values
- Extension settings can override project configuration
- Different memory limits or timeout settings
- File watching behavior can interfere

## Solutions

### Recommended: Use Terminal Instead of VS Code Test Runner

The most reliable approach is to run tests directly in the terminal:

```bash
# In VS Code integrated terminal
pnpm test:unit

# Or for specific files
pnpm jest path/to/test.tsx

# With watch mode
pnpm test:watch
```

### Configure VS Code Jest Extension (If You Must Use It)

Create or update `.vscode/settings.json`:

```json
{
  "jest.jestCommandLine": "pnpm test:unit --",
  "jest.runMode": "on-demand",
  "jest.autoRun": "off",
  "jest.nodeEnv": {
    "JEST_UNIT_ONLY": "1"
  },
  "jest.shell": "/bin/bash",
  "jest.rootPath": "app-next-directory",
  "jest.disabledWorkspaceFolders": ["sanity"],
  "jest.coverageColors": {
    "covered": "rgba(0, 255, 0, 0.2)",
    "uncovered": "rgba(255, 0, 0, 0.2)",
    "partially-covered": "rgba(255, 255, 0, 0.2)"
  }
}
```

### Alternative: Disable VS Code Test Explorer

If flakiness persists:

1. Disable the Jest extension
2. Use terminal commands exclusively
3. Consider using a different test runner UI (Wallaby.js, Quokka)

## Best Practices

### DO:
✅ Run tests in integrated terminal
✅ Use `pnpm test:unit` command
✅ Run tests serially with `--runInBand`
✅ Use consistent environment variables
✅ Commit `.vscode/settings.json` with proper Jest config

### DON'T:
❌ Rely on VS Code Test Explorer for critical testing
❌ Use `--detectLeaks` in VS Code (even worse than CLI)
❌ Run tests in parallel in VS Code
❌ Ignore environment variable differences
❌ Mix watch mode with Test Explorer

## Debugging Flaky Tests in VS Code

### 1. Check Environment Variables

Add to your test:
```typescript
it('debug env', () => {
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('JEST_UNIT_ONLY:', process.env.JEST_UNIT_ONLY);
  console.log('JEST_WORKER_ID:', process.env.JEST_WORKER_ID);
});
```

### 2. Verify Jest Configuration

```typescript
it('debug config', () => {
  console.log('Jest config:', JSON.stringify(global, null, 2));
});
```

### 3. Check for Race Conditions

If tests pass individually but fail together:
```bash
# Run individually
pnpm jest path/to/test1.tsx
pnpm jest path/to/test2.tsx

# Run together
pnpm jest path/to/test1.tsx path/to/test2.tsx
```

### 4. Compare CLI vs VS Code Execution

```bash
# Terminal (reliable)
cd app-next-directory
pnpm test:unit -- path/to/flaky.test.tsx

# Check what VS Code is actually running
# Look at Output > Jest panel in VS Code
```

## Common Flaky Test Patterns

### Pattern 1: Async Timing

```typescript
// ❌ Flaky - VS Code may have different timing
it('async test', async () => {
  setTimeout(() => expect(true).toBe(true), 100);
});

// ✅ Reliable - always await
it('async test', async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(true).toBe(true);
});
```

### Pattern 2: Module State

```typescript
// ❌ Flaky - module state persists
let moduleState = 0;
it('test 1', () => moduleState++);
it('test 2', () => expect(moduleState).toBe(1)); // Fails if run out of order

// ✅ Reliable - reset in beforeEach
let moduleState = 0;
beforeEach(() => moduleState = 0);
it('test 1', () => moduleState++);
it('test 2', () => expect(moduleState).toBe(0));
```

### Pattern 3: Global Mocks

```typescript
// ❌ Flaky - mock state leaks
jest.mock('module');

// ✅ Reliable - clear mocks
afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules(); // If needed
});
```

## When Tests Fail Only in VS Code

If a test consistently passes in terminal but fails in VS Code:

1. **Accept it**: Use terminal for that test
2. **Report it**: File issue with VS Code Jest extension
3. **Workaround**: Add environment checks in test setup
4. **Alternative**: Use a different test runner

## Performance Tips

VS Code Test Explorer can be slow with large test suites:

```json
{
  // Limit file watching
  "jest.autoRun": "off",
  
  // Run tests manually
  "jest.runMode": "on-demand",
  
  // Exclude large directories
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.git/**": true,
    "**/dist/**": true,
    "**/.next/**": true
  }
}
```

## Summary

**Primary Recommendation**: Use the terminal for reliable test execution. VS Code's Test Explorer is convenient but not reliable enough for critical testing workflows.

**Fallback**: If you must use VS Code Test Explorer, configure it properly and accept that some flakiness is unavoidable with complex Next.js test setups.

**Reality**: Terminal testing is more reliable, faster to debug, and gives you full control over Jest execution.
