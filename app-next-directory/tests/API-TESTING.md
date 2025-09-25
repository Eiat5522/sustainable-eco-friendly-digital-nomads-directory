# API Testing Strategy - E2E vs Unit Tests

## Problem Addressed

The original `/api/events` test file mixed E2E testing (using Playwright) with Jest mocking strategies, which created several critical issues:

1. **Jest mocks don't work in Playwright E2E tests** - Jest mocks affect the test process module cache, not the API server being tested
2. **Unpredictable test failures** - E2E tests made real HTTP requests that could fail based on external dependencies
3. **Mixed testing concerns** - Combined integration testing (appropriate for E2E) with error simulation (better for unit tests)

## Solution Implemented

### Unit Tests (`app/api/events/route.test.ts`)
**Purpose**: Test API route logic with controlled inputs and mocked dependencies
**Framework**: Jest with mocking
**Coverage**:
- ✅ Success scenarios with mock data validation
- ✅ Error handling when Sanity throws exceptions
- ✅ Query parameter handling
- ✅ Correct Sanity query construction
- ✅ Response structure validation

**Example**:
```typescript
jest.mock('@/lib/sanity/client', () => ({
  client: { fetch: jest.fn() }
}));

test('returns 500 when Sanity fetch throws an error', async () => {
  (client.fetch as jest.Mock).mockRejectedValueOnce(new Error('Sanity connection failed'));
  const req = new Request('http://localhost/api/events');
  const res = await GET(req);
  expect(res.status).toBe(500);
});
```

### E2E Tests (`tests/api/events.test.ts`)
**Purpose**: Test actual endpoint behavior in integration environment
**Framework**: Playwright without mocking
**Coverage**:
- ✅ Basic endpoint availability
- ✅ Response structure validation for both success/error cases
- ✅ Real HTTP request/response cycle

**Example**:
```typescript
test('endpoint returns proper response structure', async ({ request }) => {
  const response = await request.get('/api/events');
  expect([200, 500]).toContain(response.status()); // Handle both scenarios
  
  const json = await response.json();
  if (response.status() === 200) {
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  } else {
    expect(json.success).toBe(false);
    expect(typeof json.error).toBe('string');
  }
});
```

## Running the Tests

```bash
# Unit tests (Jest with mocking)
JEST_UNIT_ONLY=1 npx jest app/api/events/route.test.ts --config=jest.config.cjs

# E2E tests (Playwright integration)
npm run test:e2e -- tests/api/events.test.ts
```

## Guidelines for Future API Tests

### Use Unit Tests When:
- Testing error scenarios and edge cases
- Validating business logic with controlled inputs
- Testing with mocked external dependencies
- Fast feedback during development

### Use E2E Tests When:
- Validating actual endpoint availability
- Testing real request/response cycles
- Verifying integration with actual infrastructure
- Testing user-facing API behavior

### Avoid:
- ❌ Jest mocking in Playwright E2E tests
- ❌ Real network requests in unit tests
- ❌ Mixing testing concerns in a single test file
- ❌ Tests that depend on external services being available

This separation improves test reliability, maintainability, and provides clear feedback about different types of failures.