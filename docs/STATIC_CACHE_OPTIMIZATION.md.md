### Objective: Implement Static Cache Optimization for Listing Detail Pages (`/listings/[slug]`)

Follow these steps to refactor the Listing Detail pages to leverage the Next.js 16 Data Cache and Partial Prerendering (PPR). This strategy ensures high performance through static delivery while maintaining data freshness via targeted revalidation.

#### Step 1: Clean Up Legacy Configurations
Locate the `page.tsx` file for the listing details and remove outdated segment configurations.
*   **Action:** Delete any instances of `export const revalidate = ...` or `export const dynamic = ...`.
*   **Rationale:** These are superseded by the more flexible `'use cache'` and `cacheLife` directives.

#### Step 2: Enable Static Pre-generation with `generateStaticParams`
To achieve the best Time to First Byte (TTFB), pre-build popular or new listings at build time.
*   **Implementation:** Use `generateStaticParams` to fetch slugs from your CMS (e.g., Sanity).
*   **Fallback:** Listings not pre-generated will be generated on the first request and subsequently cached.

#### Step 3: Apply the `'use cache'` Directive and Tagging
Incorporate the new caching primitives at the top of your page component to store the output in the Full Route Cache.
*   **Add Directive:** Place `'use cache'` at the top of the component or data-fetching function.
*   **Set Lifetime:** Use `cacheLife('max')` for infinite caching, as listing data typically changes only via specific edits.
*   **Apply Tags:** Implement `cacheTag(\`listing-${slug}\`)` to allow for precise, on-demand invalidation.

#### Step 4: Implement Partial Prerendering (PPR) with `<Suspense>`
Isolate dynamic or secondary content to prevent them from blocking the static shell.
*   **Action:** Wrap sections that depend on live data (e.g., "Recommended nearby venues") in a `<Suspense>` boundary with a fallback spinner or skeleton.
*   **Result:** The main listing details (title, images, description) will render immediately from the static cache while the dynamic parts stream in later.

#### Step 5: Isolate Interactive Elements
Maintain the "public" status of the cached page by keeping user-specific logic in client components.
*   **Favorites/Save Button:** Render a generic button on the server. Use a small `'use client'` component to update its state (e.g., "filled") based on user data fetched on the client side.
*   **Galleries/Maps:** Ensure large data presentation sections remain Server Components to keep the client JS bundle small.

#### Step 6: Configure On-Demand Revalidation
Set up a mechanism to purge the cache when listing data is updated in the CMS.
*   **Webhook Trigger:** Call `revalidateTag(\`listing-${slug}\`)` within a CMS webhook handler or admin action.
*   **Review Submission:** If users can post reviews, use `updateTag('reviews')` in the server action to instantly refresh the reviews section for that listing.

### Sample Implementation Snippet
```typescript
import { cacheLife, cacheTag } from 'next/cache';
import { Suspense } from 'react';

// Step 2: Pre-build paths
export async function generateStaticParams() {
  const listings = await fetchAllListingSlugs();
  return listings.map((slug) => ({ slug }));
}

export default async function ListingPage({ params }: { params: { slug: string } }) {
  // Step 3: Caching Directives
  'use cache';
  cacheLife('max');
  cacheTag(`listing-${params.slug}`);

  const listingData = await getListingDetail(params.slug);

  return (
    <div>
      <h1>{listingData.title}</h1>
      {/* Static content renders immediately */}
      
      {/* Step 4: PPR for dynamic/slow content */}
      <Suspense fallback={<p>Loading recommendations...</p>}>
        <NearbyVenues slug={params.slug} />
      </Suspense>

      {/* Step 5: Interactive client components */}
      <FavoriteButton listingId={listingData.id} />
    </div>
  );
}
```
