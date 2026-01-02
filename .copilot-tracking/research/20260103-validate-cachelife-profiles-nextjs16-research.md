<!-- markdownlint-disable-file -->
# Research: Validate cacheLife Profiles in Next.js 16

## Project Context
- **Next.js Version**: 16.1.0 (confirmed in package.json)
- **Cache Components Enabled**: `cacheComponents: true` in next.config.mjs
- **CacheLife Profiles Defined**:
  - `instant`: { stale: 30, revalidate: 60, expire: 0 }
  - `short`: { stale: 30, revalidate: 60, expire: 30 }
  - `medium`: { stale: 60, revalidate: 600, expire: 300 }
  - `long`: { stale: 300, revalidate: 86400, expire: 604800 }

## Next.js 16 cacheLife Documentation
From https://nextjs.org/docs/app/api-reference/next-config-js/cacheLife:

### cacheLife Configuration
- Defines custom cache profiles for `revalidateTag(tag, profile)` usage
- Requires `cacheComponents: true` to be enabled
- Profiles have three properties:
  - `stale`: Duration client caches without checking server
  - `revalidate`: Frequency cache refreshes on server
  - `expire`: Maximum duration before switching to dynamic

### Usage in Components/Functions
```typescript
import { cacheLife } from 'next/cache';

async function getCachedData() {
  'use cache'
  cacheLife('blog')
  const data = await fetch('/api/data')
  return data
}
```

## revalidateTag Documentation
From https://nextjs.org/docs/app/api-reference/functions/revalidateTag:

### Function Signature
```typescript
revalidateTag(tag: string, profile: string | { expire?: number }): void
```

### Revalidation Behavior
- `profile="max"` (recommended): Marks tag as stale, uses stale-while-revalidate
- Custom profile: Uses defined cacheLife profile
- `{ expire: 0 }`: Immediate expiration

### Tagging Data
- Using `next.tags` with fetch: `fetch(url, { next: { tags: ['posts'] } })`
- Using `cacheTag` in cached functions: `cacheTag('posts')`

### Current Codebase Analysis
- No existing usage of `cacheLife`, `revalidateTag`, `cacheTag`, or `'use cache'` directive
- Cache profiles defined but not tested or used
- No runtime errors expected since features are opt-in

## Testing Strategy
1. **Build Validation**: Ensure Next.js 16 builds successfully with cacheLife config
2. **Runtime Testing**: Create test components/functions using cacheLife profiles
3. **Revalidation Testing**: Test revalidateTag with different profiles
4. **Error Handling**: Verify no runtime errors when features are used incorrectly

## Implementation Patterns
From Next.js documentation and GitHub examples:

### Basic Cache Function
```typescript
import { cacheLife } from 'next/cache';

export async function getData() {
  'use cache'
  cacheLife('short')
  return await fetch('/api/data')
}
```

### Tagged Cache Function
```typescript
import { cacheTag } from 'next/cache';

export async function getPosts() {
  'use cache'
  cacheTag('posts')
  cacheLife('medium')
  return await fetch('/api/posts')
}
```

### Revalidation
```typescript
import { revalidateTag } from 'next/cache';

export async function updatePost() {
  await updatePostInDB()
  revalidateTag('posts', 'max')
}
```

## Potential Issues
- Cache profiles must be defined before use
- `cacheComponents: true` must be enabled
- Tag names are case-sensitive and limited to 256 characters
- Revalidation only triggers on next visit (stale-while-revalidate)

## Validation Steps
1. Create test cached functions using each profile
2. Test revalidateTag with different profiles
3. Verify build completes without errors
4. Test runtime behavior in development
5. Ensure no console errors or warnings