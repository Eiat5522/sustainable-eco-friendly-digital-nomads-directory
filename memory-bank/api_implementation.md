# API Implementation Decisions (Updated: 2025-06-16)

## REST-like Endpoint Structure

- Implemented under `/src/app/api/*` following Next.js App Router conventions
- Using standardized response envelope: `{ success: boolean, data?: any, error?: string }` (Note: Some Sanity-direct fetches like `getListingData` in `src/lib/sanity/data.ts` return the direct Sanity object or null on error, rather than this envelope).
- Zod validation for request parameters and payloads where applicable.

## Sanity Integration

- Using `@sanity/client` with separate preview client for draft content (configured in `src/lib/sanity/client.ts`).
- Specific data fetching functions (e.g., `getListingData` in `src/lib/sanity/data.ts`) encapsulate GROQ queries for direct use in Server Components or API routes.
- Queries optimized for CDN caching where possible (default client `useCdn: true`).
- Image URL generation handled through `@sanity/image-url` via `urlFor` helper in `src/lib/sanity/client.ts`.
- Environment variables properly configured for both development and production.

## Security Considerations

- Preview mode restricted by token (via `previewClient` and `getClient` logic in `src/lib/sanity/client.ts`).
- Input validation on all API routes.
- Rate limiting to be implemented via Netlify Edge Functions or similar middleware.
- Proper error handling and logging implemented in API routes and data fetching functions.

## API Endpoints & Data Fetching

(This section primarily describes server-side API routes. Direct Sanity fetches from server components are handled by functions in `src/lib/sanity/data.ts` or similar.)

### /api/listings

- **GET**: Fetch listings with filtering options (category, location, eco-rating). This functionality is primarily handled by the `/api/search/route.ts` which uses Sanity GROQ queries.
- Query parameters validated using Zod schema within the search route.
- CDN-optimized queries for production.

### /api/listings/[slug]

- **Note**: While an API route `GET /api/listings/[slug]` could be created, the primary method for fetching single listing data for page rendering (e.g., `app-next-directory/src/app/listings/[slug]/page.tsx`) is now via the server-side `getListingData(slug)` function in `src/lib/sanity/data.ts`. This function directly queries Sanity.

### /api/reviews

- **GET /api/reviews/[listingId]**: Fetch reviews for a specific listing.
- **POST /api/reviews**: Create new reviews with validation.
- **POST /api/reviews/[reviewId]/vote**: Handle upvotes/downvotes for reviews.
- Protected routes requiring authentication for posting and voting.

### /api/events

- GET: Fetch upcoming events (if implemented).
- Date-based filtering built into query.
- Includes eco-initiatives data.

### /api/cities

- **GET /api/cities**: Fetches a list of cities, often with aggregated data like listing counts.
- **GET /api/cities/[slug]**: Fetches details for a specific city, potentially including listings within that city.

### /api/search

- **GET /api/search**: A comprehensive endpoint for searching listings based on various criteria like keywords, category, city, eco-tags, etc. Uses Sanity GROQ queries for efficient data retrieval. Supports pagination.

### /api/featured-listings

- **GET /api/featured-listings**: Fetches a curated list of featured listings, typically for display on the homepage.

## Performance Optimizations

- CDN enabled for production Sanity client.
- Query projections in GROQ to minimize response payload.
- Cached queries where appropriate (Sanity's CDN handles much of this).
- Error boundaries and logging in Next.js components and API routes.

## Future Considerations

- Implement webhook handlers for Sanity content updates to trigger revalidation or cache updates.
- Add a more robust caching layer for frequently accessed, non-Sanity API data if needed.
- Set up detailed monitoring for API performance metrics.
- Implement batch operations for reviews or other entities if bulk updates become common.
- Solidify rate limiting for all public and authenticated endpoints.
