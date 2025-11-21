# Caching Strategy Documentation

## Overview

This document describes the comprehensive caching strategy implemented across the Sustainable Digital Nomads Directory application. The caching layer is designed to improve performance, reduce database load, and provide a better user experience.

## Architecture

### Caching Layers

1. **Redis Cache** (Primary)
   - Provider: Upstash Redis
   - Backend for all caching operations
   - Supports TTL, tag-based invalidation, and SWR patterns

2. **In-Memory Fallback**
   - Used when Redis is unavailable
   - Request deduplication to prevent cache stampede
   - No persistence across deployments

3. **Next.js Route Segment Caching**
   - ISR (Incremental Static Regeneration) for pages
   - Route-level revalidation for API routes

## Cache Configuration

### Cache Profiles

Located in `src/lib/cache-strategy.ts`:

```typescript
CACHE_CONFIGS = {
  STATIC: {
    ttl: 86400,      // 24 hours
    swr: true,
    staleTime: 43200 // 12 hours
  },
  STANDARD: {
    ttl: 3600,       // 1 hour
    swr: true,
    staleTime: 1800  // 30 minutes
  },
  DYNAMIC: {
    ttl: 300,        // 5 minutes
    swr: true,
    staleTime: 120   // 2 minutes
  },
  SEARCH: {
    ttl: 600,        // 10 minutes
    swr: false
  },
  USER: {
    ttl: 120,        // 2 minutes
    swr: false
  }
}
```

### Stale-While-Revalidate (SWR)

Enabled for static, standard, and dynamic caches:
- Serves stale content immediately
- Revalidates in background
- Ensures fast responses while keeping data fresh

## Cached Queries

### 1. Static Data (24 hour TTL)

**Categories**
```typescript
// Location: app/api/categories/route.ts
export const revalidate = 86400;

await cacheHelpers.categories(async () => {
  return await client.fetch(
    groq`array::unique(*[_type == "listing" && defined(category)].category)`
  );
});
```

**Amenities**
```typescript
// Location: app/api/amenities/route.ts
export const revalidate = 86400;

await cacheHelpers.amenities(async () => {
  return await client.fetch(`*[_type == "amenity"] | order(name asc) {
    _id,
    name
  }`);
});
```

**Eco Tags**
```typescript
// Location: app/api/eco-tags/route.ts
export const revalidate = 86400;

await cacheHelpers.ecoTags(async () => {
  return await client.fetch(`*[_type == "ecoTag"] | order(name asc) {
    _id,
    name
  }`);
});
```

### 2. Search Results (10 minute TTL)

**Search API**
```typescript
// Location: app/api/search/route.ts
export const revalidate = 600;

await cacheHelpers.searchResults(searchParams, async () => {
  // Execute search query
  return results;
});
```

### 3. Sanity CMS Queries (1 hour TTL)

**Cached Client**
```typescript
// Location: src/lib/sanity/cached-client.ts
import { cachedClient } from '@/lib/sanity/cached-client';

const data = await cachedClient.fetch(query, params, ttl);
```

**Direct Caching**
```typescript
import { cacheHelpers } from '@/lib/cache-strategy';

const data = await cacheHelpers.sanityQuery(
  query,
  params,
  async () => client.fetch(query, params)
);
```

### 4. Page-Level ISR

**Listing Detail Pages**
```typescript
// Location: app/listings/[slug]/page.tsx
export const revalidate = 300; // 5 minutes
```

**City Pages**
```typescript
// Location: app/cities/[slug]/page.tsx
export const revalidate = 3600; // 1 hour
```

**Blog Pages**
```typescript
// Location: app/blog/[slug]/page.tsx
export const revalidate = 1800; // 30 minutes
```

## Cache Invalidation

### Tag-Based Invalidation

```typescript
import { invalidateCache } from '@/lib/cache-strategy';

// Invalidate by tag
await invalidateCache('categories', true);
await invalidateCache('amenities', true);
await invalidateCache('eco-tags', true);

// Invalidate specific key
await invalidateCache('search:specific-key');
```

### Manual Revalidation

Use the revalidation API:

```typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';

// Revalidate specific path
revalidatePath('/listings/[slug]');

// Revalidate tag
revalidateTag('listings');
```

## Cache Monitoring

### Metrics Collection

```typescript
import { getCacheMetrics } from '@/lib/cache-strategy';

// Get all metrics
const allMetrics = getCacheMetrics();

// Get specific key metrics
const keyMetrics = getCacheMetrics('sanity:query-key');

// Metrics include:
// - hits: number
// - misses: number
// - errors: number
// - lastAccess: Date
```

### Resetting Metrics

```typescript
import { resetCacheMetrics } from '@/lib/cache-strategy';

// Reset all metrics
resetCacheMetrics();

// Reset specific key
resetCacheMetrics('sanity:query-key');
```

## Query Optimization

### Projection Best Practices

Always use projections to limit fields:

```groq
*[_type == "listing"] {
  _id,
  name,
  "slug": slug.current,
  // Only select needed fields
}
```

### Sanity CDN

Sanity's CDN automatically caches responses:
- Default cache: 60 seconds
- Configure in Sanity dashboard
- Use with ISR for optimal performance

## Performance Guidelines

### 1. Cache Key Generation

- Use consistent parameter ordering
- Base64 encode for complex parameters
- Include version in key for schema changes

### 2. Cache Stampede Prevention

- Request deduplication for in-flight queries
- Use SWR pattern for high-traffic queries
- Implement proper error handling

### 3. Memory Management

- Set appropriate TTLs
- Use tag-based invalidation for bulk updates
- Monitor cache hit rates

### 4. Testing Caching

```typescript
// Disable caching in tests
process.env.NODE_ENV = 'test';

// Or mock Redis client
import { setRedisClient } from '@/lib/redis';
setRedisClient(mockRedis);
```

## Troubleshooting

### Cache Not Working

1. **Check Redis Connection**
   ```bash
   # Verify environment variables
   echo $UPSTASH_REDIS_REST_URL
   echo $UPSTASH_REDIS_REST_TOKEN
   ```

2. **Check Logs**
   ```typescript
   // Look for cache warnings
   structuredLogger.warn('Cache read failed', ...)
   ```

3. **Verify TTL**
   ```typescript
   // Ensure TTL is set correctly
   const { ttl } = CACHE_CONFIGS.STANDARD;
   ```

### High Cache Miss Rate

1. **Check Key Generation**
   - Ensure consistent parameter ordering
   - Verify base64 encoding is deterministic

2. **Review TTL Settings**
   - May be too short for your use case
   - Consider increasing for static data

3. **Monitor Metrics**
   ```typescript
   const metrics = getCacheMetrics();
   console.log('Hit rate:', metrics.hits / (metrics.hits + metrics.misses));
   ```

## Future Enhancements

### Planned Improvements

1. **Cache Warming**
   - Pre-populate cache for common queries
   - Background job for popular searches

2. **Edge Caching**
   - Leverage Vercel Edge Network
   - Reduce latency for global users

3. **Query Complexity Analysis**
   - Identify expensive queries
   - Automatic cache strategy selection

4. **Cache Analytics Dashboard**
   - Real-time hit/miss rates
   - Memory usage tracking
   - Query performance metrics

## Related Documentation

- [Redis Configuration](./REDIS_SETUP.md)
- [Sanity Integration](./SANITY_INTEGRATION.md)
- [Performance Optimization](./PERFORMANCE.md)
- [Monitoring Guide](./MONITORING.md)

## References

- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Sanity CDN](https://www.sanity.io/docs/api-cdn)
