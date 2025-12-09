# MSW (Mock Service Worker) Testing Guide

## Overview

This project uses MSW (Mock Service Worker) v2.11+ to intercept and mock network requests at the network level during testing. This provides more reliable and realistic mocking compared to Jest module mocks.

## Architecture

### Handler Organization

MSW handlers are organized in `src/mocks/handlers/`:

```
src/mocks/
├── handlers/
│   ├── index.ts       # Central export of all handlers
│   ├── sanity.ts      # Sanity CMS API handlers
│   ├── redis.ts       # Redis/Upstash REST API handlers
│   └── api.ts         # Internal Next.js API route handlers
├── handlers.ts        # Backward compatibility re-export
├── sanity-handlers.ts # Backward compatibility re-export
└── server.ts          # MSW server setup for Node.js tests
```

### Automatic Setup

MSW server is automatically configured in `jest.setup.ts`:

```typescript
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Handler Coverage

### 1. Sanity CMS Handlers (`handlers/sanity.ts`)

Intercepts all Sanity API requests:

**Endpoints:**
- `GET https://{projectId}.api.sanity.io/v{apiVersion}/data/query/{dataset}` - GROQ queries
- `GET https://{projectId}.api.sanity.io/v{apiVersion}/data/doc/{dataset}/{docId}` - Get document
- `POST https://{projectId}.api.sanity.io/v{apiVersion}/data/mutate/{dataset}` - Mutations

**Supported Queries:**
- `_type == "nomadFeature"` - Returns digital nomad features
- `_type == "listing"` - Returns listings with full data
- `_type == "review"` - Returns reviews
- `_type == "city"` - Returns cities
- Count queries with `count()`

**Example:**
```typescript
// MSW automatically intercepts this:
const features = await client.fetch('*[_type == "nomadFeature"] | order(name asc)');
```

### 2. Redis/Upstash Handlers (`handlers/redis.ts`)

Intercepts Upstash Redis REST API requests:

**Commands:**
- `GET /get/{key}` - Get value
- `POST /set/{key}` - Set value (supports EX expiration)
- `POST /incr/{key}` - Increment value
- `POST /del/{key}` - Delete key
- `POST /expire/{key}` - Set expiration
- `GET|POST /ping` - Ping command

**In-Memory Store:**
The Redis handlers maintain an in-memory store that persists across requests within a test but resets between tests.

**Helper Functions:**
```typescript
import { resetRedisStore, seedRedisStore, getRedisStoreState } from '@/mocks/handlers/redis';

// Reset store between tests
beforeEach(() => {
  resetRedisStore();
});

// Seed with test data
seedRedisStore({
  'user:1:views': 42,
  'listing:abc:rating': 4.5,
});

// Inspect current state (for debugging)
const state = getRedisStoreState();
```

### 3. Internal API Handlers (`handlers/api.ts`)

Intercepts internal Next.js API routes:

**Covered Endpoints:**
- `/api/search` (GET, POST) - Search functionality
- `/api/listings` - Listings CRUD
- `/api/reviews` (GET, POST) - Reviews
- `/api/categories` - Categories
- `/api/cities`, `/api/cities/:slug` - Cities
- `/api/user/favorites` - User favorites
- `/api/auth/providers`, `/api/auth/register` - Authentication
- `/api/contact` - Contact form
- Various utility endpoints

## Usage Patterns

### Basic Test with Default Handlers

Most tests don't need any special setup - MSW is automatically active:

```typescript
import { GET } from './route';

describe('API Route', () => {
  it('returns data', async () => {
    const req = new Request('http://localhost/api/listings');
    const res = await GET(req);
    const data = await res.json();
    
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
```

### Overriding Handlers for Specific Tests

Use `server.use()` to override handlers for specific test cases:

```typescript
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

describe('Error handling', () => {
  it('handles API errors', async () => {
    // Override for this test only
    server.use(
      http.get('/api/listings', () => {
        return HttpResponse.json(
          { error: 'Server error' },
          { status: 500 }
        );
      })
    );

    const req = new Request('http://localhost/api/listings');
    const res = await GET(req);
    
    expect(res.status).toBe(500);
  });
});
```

### Using Helper Functions

For common test scenarios, use the provided helper functions:

```typescript
import { setReviewsResponse } from '@/mocks/handlers';
import { server } from '@/mocks/server';

it('handles unauthorized review creation', async () => {
  server.use(setReviewsResponse('unauthorized'));
  
  // Test code that expects 401 response
});
```

### Testing Sanity Queries

Sanity queries are automatically intercepted:

```typescript
import { client } from '@/lib/sanity/client';

it('fetches nomad features', async () => {
  const features = await client.fetch('*[_type == "nomadFeature"] | order(name asc)');
  
  // MSW returns mock data from handlers/sanity.ts
  expect(features).toHaveLength(4);
  expect(features[0].name).toBe('Co-working Space');
});
```

### Testing Redis Operations

Redis operations via Upstash are intercepted:

```typescript
import { redis } from '@/lib/redis';
import { resetRedisStore, seedRedisStore } from '@/mocks/handlers/redis';

beforeEach(() => {
  resetRedisStore();
});

it('increments view count', async () => {
  const client = redis();
  if (!client) throw new Error('Redis client not available');
  
  await client.incr('views:listing-1');
  await client.incr('views:listing-1');
  
  const count = await client.get('views:listing-1');
  expect(count).toBe(2);
});
```

## MSW vs Jest Mocks

### When to Use MSW

✅ **Use MSW for:**
- External API calls (Sanity, Redis/Upstash, etc.)
- Internal API route testing
- Integration tests that make real HTTP requests
- Testing fetch() calls
- Consistent behavior across test suites

### When to Use Jest Mocks

✅ **Use Jest mocks for:**
- Non-HTTP operations (database queries, file system, etc.)
- Module dependencies that don't make network calls
- Auth/session mocking (since it's not HTTP-based in Next.js)
- Utility functions and pure logic

### Hybrid Approach Example

```typescript
// Mock auth (not HTTP-based)
jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

import { auth } from '@/lib/auth';
import { POST } from './route';

it('creates review when authenticated', async () => {
  // Jest mock for auth
  (auth as jest.Mock).mockResolvedValue({
    user: { id: 'user-1', role: 'user' }
  });
  
  // MSW intercepts Sanity API calls automatically
  const req = new Request('http://localhost/api/reviews', {
    method: 'POST',
    body: JSON.stringify({
      listingId: 'listing-1',
      rating: 5,
      comment: 'Great place!',
    }),
  });
  
  const res = await POST(req);
  expect(res.status).toBe(201);
});
```

## Common Patterns

### 1. Testing Different Response States

```typescript
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

describe('Response states', () => {
  it('handles 404', async () => {
    server.use(
      http.get('/api/listings/:id', ({ params }) => {
        return HttpResponse.json(
          { error: 'Not found' },
          { status: 404 }
        );
      })
    );
    
    // Test code...
  });
  
  it('handles network errors', async () => {
    server.use(
      http.get('/api/listings', () => {
        return HttpResponse.error();
      })
    );
    
    // Test code...
  });
});
```

### 2. Parameterized Handlers

```typescript
server.use(
  http.get('/api/listings/:id', ({ params }) => {
    const { id } = params;
    
    if (id === 'non-existent') {
      return HttpResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      success: true,
      data: { id, name: 'Test Listing' },
    });
  })
);
```

### 3. Request Inspection

```typescript
server.use(
  http.post('/api/reviews', async ({ request }) => {
    const body = await request.json();
    
    // Validate request structure
    if (!body.rating || !body.comment) {
      return HttpResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }
    
    return HttpResponse.json({ success: true });
  })
);
```

## Debugging MSW

### Enable Logging

Set `onUnhandledRequest` to `'warn'` to see unhandled requests:

```typescript
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});
```

### List Active Handlers

```typescript
import { server } from '@/mocks/server';

console.log(server.listHandlers());
```

### Debugging Tips

1. **Check handler order** - More specific handlers should come before generic ones
2. **Verify URL patterns** - Ensure URL patterns match exactly (including query params)
3. **Check request method** - GET vs POST handlers won't intercept each other
4. **Inspect request details** - Log `request.url`, `request.method`, etc.

### Common Issues

**Issue:** Handler not intercepting requests
```typescript
// ❌ Wrong - missing http:// prefix
server.use(http.get('/api/listings', ...));

// ✅ Correct - include full URL or use relative path consistently
server.use(http.get('http://localhost/api/listings', ...));
// OR
server.use(http.get('/api/listings', ...));
```

**Issue:** Handler matches too broadly
```typescript
// ❌ Wrong - matches ALL paths
server.use(http.get('*', ...));

// ✅ Correct - specific path pattern
server.use(http.get('/api/*', ...));
```

## Best Practices

1. **Reset handlers between tests** - `afterEach(() => server.resetHandlers())` is automatic
2. **Use specific handlers in tests** - Override with `server.use()` for test-specific behavior
3. **Keep handlers organized** - Add new handlers to appropriate files in `handlers/`
4. **Document complex handlers** - Add comments explaining query logic
5. **Test both success and error paths** - Override handlers to test error scenarios
6. **Use TypeScript** - Leverage types for request/response validation
7. **Keep test data consistent** - Use `createTestData()` for predictable fixtures

## Migration from Jest Mocks

When migrating from Jest mocks to MSW:

### Before (Jest Mock)
```typescript
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn().mockResolvedValue([...mockData]),
  },
}));
```

### After (MSW)
```typescript
// No mock needed - MSW handles it automatically
// Or override for specific test:
server.use(
  http.get('https://:projectId.api.sanity.io/*', () => {
    return HttpResponse.json({
      result: [...mockData],
    });
  })
);
```

## Resources

- [MSW Documentation](https://mswjs.io/docs/)
- [MSW Examples](https://github.com/mswjs/examples)
- [Testing Library with MSW](https://testing-library.com/docs/react-testing-library/example-intro#mock)

## Troubleshooting

### Tests hanging or timing out

1. Ensure MSW server is properly started/stopped
2. Check for infinite loops in request handlers
3. Verify `resetHandlers()` is called in `afterEach`

### Network requests not being mocked

1. Check if handler URL pattern matches exactly
2. Verify MSW server is listening before tests run
3. Ensure handlers are imported and registered
4. Check request method (GET vs POST)

### Type errors with MSW

1. Ensure MSW v2.x is installed (`pnpm list msw`)
2. Check TypeScript types are up to date
3. Use proper `HttpResponse` from `msw` package

## Support

For issues or questions:
1. Check existing tests for patterns
2. Review MSW documentation
3. Search project issues on GitHub
4. Ask in team chat
