# Proxy Utilities

This directory contains utility functions and helpers used by the main proxy file located at `/proxy.ts`.

## Structure

```
/proxy.ts                           # Main Next.js 16 proxy entry point (root level)
/src/proxy/                         # Proxy utility functions
  ├── authCallbackHandler.ts        # Auth callback URL decoder and handler
  ├── cache.ts                      # Cache control middleware utilities
  ├── server-timing.ts              # Server-Timing header utilities
  ├── session.ts                    # Session middleware (currently disabled)
  └── __archive__/                  # Archived files from consolidation
```

## Main Proxy File

The main proxy implementation is located at **`/proxy.ts`** (project root), not in this directory.

According to Next.js 16 conventions:
- Proxy file must be at project root OR in src/ (not both)
- When using a src directory structure, having the proxy at root takes precedence
- The proxy file must export a `proxy` function and a `config` object

## Utility Functions

### authCallbackHandler.ts
Handles decoding of callback URLs and prevents double-encoding issues in authentication flows.

**Export:** `handleAuthCallbackUrl(req): string | null`

### cache.ts
Provides cache control middleware for setting appropriate cache headers based on route patterns.

**Exports:**
- `getCacheConfig(request): CacheConfig`
- `getCacheControlValue(config): string`
- `cacheMiddleware(request, response): Promise<Response>`
- `invalidateCache(path): Promise<void>`
- `purgeCache(): Promise<void>`

### server-timing.ts
Implements Server-Timing header functionality for performance monitoring.

**Exports:**
- `ServerTiming` class
- `serverTimingMiddleware(request): Response`

### session.ts
Session tracking middleware (currently disabled).

**Export:** `sessionMiddleware()`

## Usage

These utilities are imported and used by the main proxy file as needed:

```typescript
import { handleAuthCallbackUrl } from '@/proxy/authCallbackHandler';
import { cacheMiddleware } from '@/proxy/cache';
import ServerTiming from '@/proxy/server-timing';
```

## Next.js 16 Proxy Convention

For more information about Next.js 16 proxy conventions, see:
- [Next.js Proxy Documentation](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Migrating from Middleware to Proxy](https://nextjs.org/docs/app/guides/upgrading/version-16#middleware-to-proxy)

## Migration Notes

This structure was established during the Next.js 16 upgrade to:
1. Consolidate duplicate proxy files
2. Follow Next.js 16 best practices
3. Maintain clean separation between main proxy logic and utilities
4. Keep utility functions modular and testable
