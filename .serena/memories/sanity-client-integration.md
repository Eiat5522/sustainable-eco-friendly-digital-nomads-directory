# Sanity Client Integration

## Entity Type
Technical Component

## Description
Integration with Sanity CMS using custom HTTP client wrapper, providing query, create, update, delete operations with structured logging.

## Key Features
- SanityHTTPClient class with read/write client separation
- Environment-based configuration (projectId, dataset, API token)
- Debug logging with SANITY_HTTP_DEBUG flag
- Error handling with SanityAPIError
- Asset upload support for images

## Implementation Details
- Imports createClient from @sanity/client via local wrapper
- Constructor initializes read and write clients
- Methods: query, create, update, delete, uploadAsset, createMany
- Health check functionality
- Singleton accessor pattern

## Testing Challenges
- Mocking createClient from @sanity/client
- Isolated module testing for logging assertions
- Environment variable mocking
- Transaction mocking for batch operations

## Current Issues
- Mock setup in tests not capturing createClient calls
- Debugging mock application in Jest

## Files
- src/lib/sanity-http-client.ts: Main implementation
- src/lib/sanity/client.ts: Client factory wrapper
- src/lib/__tests__/sanity-http-client.test.ts: Unit tests