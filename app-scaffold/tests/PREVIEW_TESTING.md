# Preview Mode Testing Guide

This guide explains how to test the preview mode functionality in the application.

## Test Files Structure

- `tests/preview-mode.spec.ts`: UI and integration tests for preview functionality
- `tests/preview-api.spec.ts`: API route tests for preview endpoints
- `src/app/api/mock-env/route.ts`: Mock environment API for testing different configurations

## Key Test Areas

1. Preview Banner
   - Visibility when preview mode is active
   - Exit preview functionality
   - Persistence across navigation

2. Draft Content Display
   - Listing draft content visibility
   - City draft content visibility
   - Draft indicators

3. API Routes
   - Preview mode activation
   - Preview mode deactivation
   - Environment-specific behavior
   - Security checks
   - Redirect handling
   - Concurrent request handling

## Running the Tests

```bash
# Run all preview-related tests
npm run test:e2e tests/preview-*.spec.ts

# Run specific test file
npm run test:e2e tests/preview-mode.spec.ts
npm run test:e2e tests/preview-api.spec.ts
```

## Test Environment Setup

### Performance Testing
Before running performance tests:

1. Ensure test data exists by running:
```bash
node sanity/scripts/create-preview-test-data.js
```

2. Run performance tests:
```bash
npm run test:e2e tests/preview-performance.spec.ts
```

The tests will measure:
- Load time comparison between normal and preview mode
- API endpoint response times
- Memory usage during preview mode navigation
- Core Web Vitals metrics

Performance reports are generated in `test-results/performance/`.

### Visual Regression Testing
Before running visual regression tests:

1. Create test data by running:
```bash
node sanity/scripts/create-preview-test-data.js
```

2. The script will create:
   - A draft listing with ID 'test-draft-listing'
   - A draft city with ID 'test-draft-city'

3. For visual tests, run:
```bash
npm run test:e2e tests/preview-visual.spec.ts
```

Note: Visual tests will create baseline screenshots on first run. Subsequent runs will compare against these baselines.

### Mock Environment API

The mock environment API (`/api/mock-env`) allows testing different environment configurations without modifying actual environment variables. It's used in tests through HTTP headers:

```typescript
// Example: Testing production environment
await request.get('/api/mock-env', {
  headers: {
    'x-test-node-env': 'production',
    'x-test-preview-secret': 'test-secret'
  }
});
```

### Test Data Requirements

To run the tests successfully, ensure:

1. A draft listing with ID 'test-draft-listing' exists in Sanity
2. A draft city with slug 'test-draft-city' exists in Sanity
3. Preview secret is configured in test environment

## Key Test Scenarios

1. Preview Mode Activation
   - Regular activation
   - Production environment with secret
   - Invalid secret handling
   - Redirect parameter handling

2. Preview Mode State
   - Cookie management
   - State persistence across navigation
   - State clearing on exit

3. Security
   - Production environment checks
   - External URL redirect prevention
   - Concurrent request handling
   - Invalid token handling

4. Content Display
   - Draft content visibility
   - Preview indicators
   - Navigation between preview states

## Adding New Tests

When adding new preview-related tests:

1. Follow the existing patterns in `preview-mode.spec.ts` and `preview-api.spec.ts`
2. Use the mock environment API for environment-specific tests
3. Ensure proper cleanup in test teardown
4. Add appropriate assertions for both success and error cases

## Common Issues and Solutions

1. Preview Cookie Issues
   ```typescript
   // Verify preview cookie
   const cookies = await page.context().cookies();
   const previewCookie = cookies.find(cookie => cookie.name === '__previewMode');
   ```

2. Environment Mocking
   ```typescript
   // Reset environment after tests
   try {
     // Test code
   } finally {
     // Restore original environment
     await request.get('/api/mock-env', {
       headers: { 'x-test-node-env': 'test' }
     });
   }
   ```

3. Draft Content Testing
   - Ensure test content exists before running tests
   - Use consistent test data IDs
   - Clean up test data after test runs

## Best Practices

1. Always restore environment settings after tests
2. Use proper error handling and assertions
3. Test both success and failure cases
4. Maintain isolation between tests
5. Clean up any test data or state modifications
6. Use descriptive test names and comments
7. Group related tests using `describe` blocks

## Troubleshooting

If tests are failing:

1. Check Sanity test content exists
2. Verify environment configuration
3. Ensure preview secret is set
4. Check for network connectivity issues
5. Verify cookie handling in test environment
