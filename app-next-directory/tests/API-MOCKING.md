# API Mocking Guide

This guide explains how to use API mocking in our Playwright tests for the Sustainable Eco-Friendly Digital Nomads Directory project.

## 📝 Overview

We use Playwright's built-in request interception to mock API responses during testing. This allows us to:
- Test UI behavior with controlled data
- Test error scenarios
- Make tests reliable and fast
- Avoid external dependencies

## 🛠️ Basic Setup

### Default Mock Setup

```typescript
import { test } from './utils/test-fixtures';
import { setupMockApi } from './utils/test-setup';

test.beforeEach(async ({ page, mockListings }) => {
  await setupMockApi(page, mockListings);
});
```

### Custom Response Setup

```typescript
await setupMockApi(page, {
  status: 200,
  data: {
    listings: mockListings,
    total: mockListings.length
  }
});
```

## 📋 API Endpoints

### Listings API

```typescript
// Mock listings endpoint
await setupMockApi(page, mockListings, {
  endpoint: '/api/listings',
  method: 'GET'
});

// Mock filtered listings
await setupMockApi(page, filteredListings, {
  endpoint: '/api/listings?category=coworking',
  method: 'GET'
});
```

### Categories API

```typescript
await setupMockApi(page, mockCategories, {
  endpoint: '/api/categories',
  method: 'GET'
});
```

## 🔧 Advanced Configuration

### Error Responses

```typescript
// Server error
await setupMockApi(page, null, {
  status: 500,
  error: 'Internal Server Error'
});

// Not found
await setupMockApi(page, null, {
  status: 404,
  error: 'Listing not found'
});
```

### Delayed Responses

```typescript
await setupMockApi(page, mockListings, {
  delay: 1000 // 1 second delay
});
```

### Multiple Endpoints

```typescript
await setupMockApi(page, {
  '/api/listings': mockListings,
  '/api/categories': mockCategories,
  '/api/eco-tags': mockTags
});
```

## 🎯 Testing Scenarios

### Loading States

```typescript
test('shows loading state', async ({ page }) => {
  await setupMockApi(page, mockListings, {
    delay: 1000
  });
  await expect(page.locator('.loading')).toBeVisible();
});
```

### Error States

```typescript
test('handles server error', async ({ page }) => {
  await setupMockApi(page, null, {
    status: 500
  });
  await expect(page.locator('.error')).toBeVisible();
});
```

### Empty States

```typescript
test('handles no results', async ({ page }) => {
  await setupMockApi(page, []);
  await expect(page.locator('.empty-state')).toBeVisible();
});
```

## 🔍 Mock Data Structure

### Listing Data

```typescript
interface MockListing {
  id: string;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  categories: string[];
  ecoTags: string[];
}
```

### Response Format

```typescript
interface ApiResponse {
  status: number;
  data?: any;
  error?: string;
  total?: number;
  page?: number;
}
```

## 💡 Best Practices

1. **Consistent Data**
   - Use shared mock data from `mock-data.ts`
   - Keep mock data realistic
   - Include edge cases

2. **Error Handling**
   - Test different HTTP status codes
   - Test network timeouts
   - Test malformed responses

3. **Performance**
   - Mock only necessary endpoints
   - Use appropriate delays
   - Clean up mocks after tests

4. **Maintainability**
   - Keep mock setup in utilities
   - Document mock data structure
   - Update mocks when API changes

## 🐛 Debugging

### Inspect Requests

```typescript
test('debug api calls', async ({ page }) => {
  page.on('request', request => {
    console.log('Request:', request.url());
  });
  
  page.on('response', response => {
    console.log('Response:', response.status());
  });
});
```

### Mock Verification

```typescript
test('verify mock', async ({ page }) => {
  let requestReceived = false;
  
  await setupMockApi(page, mockListings, {
    onRequest: () => {
      requestReceived = true;
    }
  });
  
  // Test actions...
  expect(requestReceived).toBe(true);
});
```

## 📚 Additional Resources

- [Playwright API Mocking Docs](https://playwright.dev/docs/mock)
- [Test Utilities Documentation](./utils/README.md)
- [Mock Data Reference](./setup/mock-data.ts)
