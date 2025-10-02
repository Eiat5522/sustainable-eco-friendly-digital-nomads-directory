# MongoDB Connection Timeout Fix

## Problem

The dev server was experiencing sporadic crashes with the following error:

```
[MongoServerSelectionError: Server selection timed out after 30000 ms] {
  errorLabelSet: Set(0) {},
  reason: [TopologyDescription],
  code: undefined
}
⨯ unhandledRejection: [MongoServerSelectionError: Server selection timed out after 30000 ms]
```

### Root Causes

1. **No timeout configurations**: Both MongoClient and Mongoose connections used the default 30-second `serverSelectionTimeoutMS`, which is too long for development
2. **Unhandled promise rejections**: Connection promises were created eagerly without proper error boundaries
3. **Multiple connection instances**: The `dbConnect.ts` was creating an additional MongoClient during index synchronization, multiplying connection attempts
4. **No error recovery**: Failed connections weren't clearing the cache, preventing retry attempts

## Solution

### 1. Connection Timeout Configuration

Added proper timeout settings to both MongoClient and Mongoose connections:

```typescript
const options = {
  serverSelectionTimeoutMS: 10000,  // Reduced from 30s to 10s
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  minPoolSize: 2,
  retryWrites: true,
  retryReads: true,
};
```

**Benefits:**
- Faster failure detection (10s vs 30s)
- Better connection pooling for resource management
- Automatic retry on transient failures

### 2. Error Handling

Added comprehensive error handling in `dbConnect.ts`:

```typescript
// Error event listeners
connection.on('error', (err: Error) => {
  console.error('MongoDB connection error:', err.message);
});

connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
  // Clear cache to allow reconnection
  cached.conn = null;
  cached.promise = null;
});
```

**Benefits:**
- Prevents unhandled promise rejections
- Automatic cache clearing on disconnection
- Better visibility into connection issues

### 3. Connection Reuse

Optimized `dbConnect.ts` to reuse the Mongoose connection instead of creating additional MongoClient instances:

```typescript
// Reuse the Mongoose connection's underlying MongoDB client
const mongooseConnection = cached.conn?.connection;
if (mongooseConnection?.getClient) {
  const mongoClient = mongooseConnection.getClient();
  await initializeDatabase(mongoClient);
}
```

**Benefits:**
- Reduces number of concurrent connection attempts
- Improves resource utilization
- Prevents connection pool exhaustion

### 4. Global Error Handlers

Created `src/instrumentation.ts` to handle unhandled rejections globally:

```typescript
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('Unhandled Promise Rejection at:', promise);
  console.error('Reason:', reason);
  
  // Special handling for MongoDB errors - log but don't crash
  if (reason instanceof Error) {
    if (reason.message?.includes('MongoServerSelectionError') || 
        reason.message?.includes('Server selection timed out')) {
      console.error('MongoDB connection issue detected. Server will continue and retry on next request.');
    }
  }
});
```

**Benefits:**
- Prevents server crashes from unhandled rejections
- Provides detailed logging for debugging
- Graceful degradation for MongoDB issues

## Files Modified

1. **src/lib/mongodb.ts**
   - Added connection timeout options
   - Added error handling with cache clearing
   
2. **src/lib/dbConnect.ts**
   - Added Mongoose connection timeout options
   - Added connection event listeners
   - Optimized index sync to reuse connections
   - Added cache clearing on errors

3. **src/instrumentation.ts** (new)
   - Global unhandled rejection handler
   - Special handling for MongoDB errors

4. **.gitignore**
   - Added test file to ignore list

## Testing

All existing tests pass:
```bash
npm run test:unit -- src/lib/__tests__/dbConnect-simplified.test.ts
# ✓ 9 tests passed
```

Connection timeout verification:
```bash
node test-connection-resilience.cjs
# ✓ Timeout working correctly (10s instead of 30s)
```

## Verification

To verify the fix is working:

1. **Check timeout behavior**: Connection failures now timeout in ~10 seconds instead of 30 seconds
2. **Monitor logs**: Look for the error handlers logging connection issues
3. **Test server stability**: Server should continue running even when MongoDB connection fails
4. **Check retry behavior**: After fixing connection issues, the next request should successfully reconnect

## Best Practices

### Environment Variables

Ensure your `.env.local` has a valid MongoDB URI:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### Connection Pooling

The fix includes connection pooling:
- `maxPoolSize: 10` - Maximum 10 connections
- `minPoolSize: 2` - Minimum 2 connections maintained

This provides better performance and resource management.

### Error Monitoring

Monitor these log messages:
- `MongoDB connection failed: <error>` - Initial connection failure
- `MongoDB connection error: <error>` - Runtime connection error
- `MongoDB disconnected` - Connection lost
- `Unhandled Promise Rejection` - Uncaught async errors

## Troubleshooting

### Connection still times out

1. Check MongoDB URI is correct
2. Verify network connectivity to MongoDB
3. Check MongoDB Atlas IP whitelist settings
4. Verify MongoDB credentials

### Server still crashes

1. Check logs for other types of errors
2. Ensure instrumentation.ts is being loaded (look for "Server instrumentation registered" log)
3. Check for errors in other parts of the application

### Connection pool exhausted

1. Check `maxPoolSize` setting
2. Monitor connection usage patterns
3. Ensure connections are being properly closed
4. Consider increasing pool size for high-traffic scenarios

## Performance Impact

- **Positive**: Faster failure detection (10s vs 30s) means less waiting time
- **Positive**: Connection pooling improves throughput
- **Positive**: Connection reuse reduces overhead
- **Neutral**: Minimal overhead from error handlers
- **No negative impact** on successful connection scenarios

## Maintenance

When updating MongoDB or Mongoose versions:
1. Review connection options for new features
2. Test timeout behavior remains consistent
3. Check for deprecation warnings
4. Update documentation if options change

## References

- [MongoDB Connection Options](https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/)
- [Mongoose Connection Options](https://mongoosejs.com/docs/connections.html#options)
- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
