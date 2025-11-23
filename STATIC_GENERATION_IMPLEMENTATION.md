# Static Generation Implementation for City and Listing Pages

## Overview

This implementation adds `generateStaticParams` to city and listing pages to enable Static Site Generation (SSG) while maintaining Incremental Static Regeneration (ISR) for periodic updates.

## Changes Made

### 1. City Pages (`/app/cities/[slug]/page.tsx`)

#### Added Import
```typescript
import { getCitiesList } from '@/lib/data/city';
```

#### Added `generateStaticParams` Function
```typescript
export async function generateStaticParams() {
  // Fetch all cities from Sanity - using a high limit to get all cities
  // Adjust the limit based on your expected number of cities
  const cities = await getCitiesList(1000);
  
  // Return array of params with slug
  return cities.map((city) => ({
    slug: city.slug,
  }));
}
```

**Benefits:**
- Generates static pages for all cities at build time
- Improves initial page load performance
- Reduces server load for frequently accessed city pages
- Maintains ISR with 5-minute revalidation (`revalidate = 300`)

### 2. Listing Pages (`/app/listings/[slug]/page.tsx`)

#### Added `generateStaticParams` Function
```typescript
export async function generateStaticParams() {
  // Query to fetch all published listing slugs
  const SLUGS_QUERY = groq`*[_type == "listing" && moderation.status == "published"]{ "slug": slug.current }`;
  
  try {
    const listings = await client.fetch<Array<{ slug: string }>>(SLUGS_QUERY);
    
    // Return array of params with slug
    return listings.map((listing) => ({
      slug: listing.slug,
    }));
  } catch (error) {
    logger.error('Failed to fetch listing slugs for static generation', error, {
      component: 'listings/[slug]',
      operation: 'generateStaticParams',
    });
    // Return empty array to prevent build failure
    return [];
  }
}
```

**Benefits:**
- Generates static pages for all published listings at build time
- Improves SEO by ensuring all listing pages are pre-rendered
- Includes error handling to prevent build failures
- Maintains ISR with 5-minute revalidation (`revalidate = 300`)

## How It Works

### Static Generation + ISR
Both implementations use Next.js 15's `generateStaticParams` combined with ISR:

1. **Build Time:** All city and listing pages are pre-rendered as static HTML
2. **Runtime:** Pages are served from the static cache
3. **Revalidation:** Every 5 minutes (300 seconds), Next.js revalidates the page in the background
4. **Dynamic Updates:** New cities or listings not in the static cache are generated on-demand and cached

### Example Build Output
When you run `next build`, you'll see output like:
```
○ /cities/[slug] (ISR: 300 Seconds)
  ├ /cities/bangkok
  ├ /cities/chiang-mai
  ├ /cities/lisbon
  └ ... (more cities)

○ /listings/[slug] (ISR: 300 Seconds)
  ├ /listings/eco-coworking-space
  ├ /listings/sustainable-cafe
  ├ /listings/green-accommodation
  └ ... (more listings)
```

## Testing

### Unit Tests Added

#### City Pages (`app/cities/[slug]/page.test.tsx`)
```typescript
describe('generateStaticParams', () => {
  it('should return an array of city slugs', async () => {
    // Tests successful generation of static params
  });

  it('should return an empty array when no cities are found', async () => {
    // Tests graceful handling of no cities
  });
});
```

#### Listing Pages (`app/listings/[slug]/__tests__/page.test.tsx`)
```typescript
describe('generateStaticParams', () => {
  it('should return an array of listing slugs for published listings', async () => {
    // Tests successful generation
  });

  it('should return an empty array when no listings are found', async () => {
    // Tests graceful handling of no listings
  });

  it('should return an empty array when fetch fails', async () => {
    // Tests error handling
  });
});
```

### Test Results
All tests passing:
- City page tests: 35 passed
- Listing page tests: 11 passed (including 3 new tests for generateStaticParams)

## Performance Impact

### Before
- All city and listing pages were dynamically rendered with ISR
- First request to a page would trigger server-side rendering
- Slower initial page loads for users

### After
- All city and listing pages are pre-rendered at build time
- First request serves static HTML immediately
- Faster initial page loads and improved Core Web Vitals
- Better SEO as all pages are available to crawlers at deploy time

## Configuration

### Adjusting the City Limit
The city page uses a limit of 1000 cities. If you expect more than 1000 cities:

```typescript
const cities = await getCitiesList(2000); // Adjust as needed
```

Or modify the `getCitiesList` function to fetch all cities without a limit.

### Error Handling
The listing page includes error handling to prevent build failures. If Sanity is unreachable during build:
- An error is logged
- An empty array is returned
- Build continues without static pages (ISR will handle on-demand generation)

## Deployment Considerations

### Vercel
- Static pages are automatically deployed to the Edge Network
- ISR updates are handled automatically
- No additional configuration needed

### Other Platforms
- Ensure your hosting platform supports Next.js ISR
- Static files will be in the `.next` output directory
- ISR may require additional serverless function support

## Maintenance

### Adding New Cities or Listings
No code changes needed! The ISR configuration ensures:
1. New content is generated on first request
2. Pages are cached for future requests
3. Build regeneration updates all static pages

### Revalidation Time
To change the revalidation interval, modify the `revalidate` export:
```typescript
export const revalidate = 600; // 10 minutes instead of 5
```

## Related Files
- `/app/cities/[slug]/page.tsx` - City page implementation
- `/app/listings/[slug]/page.tsx` - Listing page implementation
- `/src/lib/data/city.ts` - City data fetching functions
- `/src/lib/sanity/client.ts` - Sanity CMS client
- `/app/cities/[slug]/page.test.tsx` - City page tests
- `/app/listings/[slug]/__tests__/page.test.tsx` - Listing page tests

## References
- [Next.js generateStaticParams Documentation](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [Next.js ISR Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
