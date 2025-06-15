# API Implementation Decisions (2025-05-16)

## REST-like Endpoint Structure
- Implemented under `/src/app/api/*` following Next.js App Router conventions
- Using standardized response envelope: `{ success: boolean, data?: any, error?: string }`
- Zod validation for request parameters and payloads

## Sanity Integration
- Using `@sanity/client` with separate preview client for draft content
- Queries optimized for CDN caching where possible
- Image URL generation handled through `@sanity/image-url`
- Environment variables properly configured for both development and production

## Security Considerations
- Preview mode restricted by token
- Input validation on all routes
- Rate limiting to be implemented via Netlify Edge Functions
- Proper error handling and logging implemented

## API Endpoints
### /api/listings
- GET: Fetch listings with filtering options (category, location, eco-rating)
- Query parameters validated using Zod schema
- CDN-optimized queries for production

### /api/reviews
- GET: Fetch reviews with optional listing filter
- POST: Create new reviews with validation
- Protected routes requiring authentication

### /api/events
- GET: Fetch upcoming events
- Date-based filtering built into query
- Includes eco-initiatives data

## Performance Optimizations
- CDN enabled for production
- Query projections to minimize response payload
- Cached queries where appropriate
- Error boundaries and logging

## Future Considerations
- Implement webhook handlers for Sanity content updates
- Add caching layer for frequently accessed data
- Set up monitoring for API performance metrics
- Implement batch operations for reviews
- Add rate limiting for public endpoints
