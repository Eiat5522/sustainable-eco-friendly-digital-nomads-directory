# Blog View Count Persistence

## Overview

This module implements persistent storage for blog post view counts using MongoDB. View counts are stored in a dedicated collection and survive server restarts.

## Architecture

### Database Collection
- **Name**: `blogViewCounts`
- **Schema**:
  ```typescript
  {
    postId: string;      // Unique blog post identifier from Sanity CMS
    count: number;       // Current view count
    lastViewed: Date;    // Timestamp of last view
  }
  ```

### Indexes
- **Primary Index**: `postId` (unique) - Fast lookups by post ID
- **Analytics Index**: `lastViewed` (descending) - Support for analytics queries

## Usage

### Incrementing View Count

```typescript
import { incrementViewCount } from '@/lib/viewCountPersistence';

// Increment view count for a blog post
const newCount = await incrementViewCount('post-123');
console.log(`Post has been viewed ${newCount} times`);
```

### Getting Current View Count

```typescript
import { getViewCount } from '@/lib/viewCountPersistence';

// Get current view count without incrementing
const count = await getViewCount('post-123');
console.log(`Post has ${count} views`);
```

### Initialization (Optional)

The collection is automatically initialized when first used. However, you can explicitly initialize it to create indexes upfront:

```typescript
import { initializeViewCountsCollection } from '@/lib/viewCountPersistence';

// Create indexes during app startup
await initializeViewCountsCollection();
```

## API Integration

The blog API route (`/api/blog/[slug]`) automatically tracks view counts using the PUT endpoint:

```typescript
// Client-side code to track a view
const response = await fetch(`/api/blog/${slug}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'increment_view' })
});

const { viewCount } = await response.json();
console.log(`View count: ${viewCount}`);
```

## Concurrency Safety

The implementation uses MongoDB's atomic `$inc` operator to ensure view counts are accurate even under concurrent requests:

```typescript
// Multiple simultaneous requests will be handled correctly
await collection.findOneAndUpdate(
  { postId },
  { 
    $inc: { count: 1 },           // Atomic increment
    $set: { lastViewed: new Date() }
  },
  { 
    upsert: true,                 // Create if doesn't exist
    returnDocument: 'after'       // Return updated document
  }
);
```

## Error Handling

The implementation includes graceful error handling:

1. **Database Failures**: If MongoDB is unavailable, the blog API route falls back to in-memory tracking
2. **Invalid Input**: Validates postId before database operations
3. **Index Creation**: Non-critical index creation errors are logged but don't throw

## Testing

### Unit Tests

Comprehensive unit tests cover:
- View count increment functionality (8 tests)
- Data retrieval (4 tests)
- Collection initialization (2 tests)
- Reset functionality (3 tests)
- Persistence simulation (2 tests)
- Concurrent requests (1 test)

Run tests with:
```bash
pnpm test:unit viewCountPersistence
```

### Test Environment

In test environment (`NODE_ENV=test`), the MongoDB client is automatically mocked with jest.fn() mocks that can be controlled by tests.

## Performance Considerations

### Indexes
- The unique index on `postId` ensures O(log n) lookup time
- Upsert operations are efficient for both new and existing documents

### Scalability
- Atomic operations prevent race conditions
- Each blog post has its own document, allowing horizontal scaling
- The `lastViewed` index supports potential analytics queries

## Production Deployment

### Environment Variables

Ensure `MONGODB_URI` is set in your environment:
```bash
MONGODB_URI=mongodb://your-connection-string
```

### Monitoring

Consider monitoring:
- Collection size growth rate
- Index usage statistics
- Query performance metrics
- Error rates for database operations

### Backup

The `blogViewCounts` collection should be included in your MongoDB backup strategy, though view counts are typically not mission-critical data.

## Future Enhancements

Potential improvements:
1. **Caching**: Add Redis caching layer for frequently viewed posts
2. **Analytics**: Implement time-series aggregation for view trends
3. **Rate Limiting**: Prevent view count manipulation from bots
4. **Batch Operations**: Support bulk view count retrieval
5. **TTL**: Optional expiration for old view records
