# Listing Detail Page - PRD

## Purpose
Create detailed listing pages that show full venue information, images, sustainability metrics, location map, and related listings to help digital nomads discover eco-friendly venues.

## Users
- Visitors searching for venues
- Registered users bookmarking and reviewing listings
- Admins editing listing details via Sanity

## Pages & Components 404 on missing slug; return notFound() in Next.js and render custom 404.
- 404 on missing slug; return notFound() in Next.js and render custom 404.
- Canonical URL set to /listings/[city]/[slug]; add prev/next rel where applicable.
- ListingCard (summary)
- ListingGallery (image carousel)
- Preload first image; reserve aspect-ratio box to avoid CLS; keyboard + swipe support; respects prefers-reduced-motion.
- ListingDetails (description, amenities)
- SustainabilityMetrics (scores & badges)
- MapEmbed (Leaflet)
- Client-only via dynamic import; provide fixed container height; comply with tile attribution and TOS.
- RelatedListings slider
- Accessible (tab/arrow keys, ARIA roles); lazy-load offscreen slides; server-render the first slide to improve LCP.


## APIs & Data
- Sanity document type: `listing` (title, slug, images, amenities, sustainabilityFeatures, rating, location)
- Suggested schema fields:
    - title (string), slug (slug, unique), city (string), address (string), description (block content)
    - images (array of image objects with: asset, alt (string), hotspot)
    - amenities (array<string>), sustainabilityFeatures (array<string|reference>), rating (number 0–5, step 0.1)
    - location (geopoint: {lat, lng}), updatedAt (datetime), publishedAt (datetime), isFeatured (boolean)
  - Uniqueness: ensure slug is unique per document via the slug field. Enforce city+slug uniqueness with a custom validation rule to prevent collisions across cities.city+slug for fast lookups.
- Next.js server component to fetch listing by slug using `next-sanity` client
- GROQ example:
  - Query (published):
    `*[_type=="listing" && slug.current==$slug && city==$city && !(_id in path("drafts.**"))][0]{title, "slug": slug.current, city, address, description, "images": images[]{..., "alt": coalesce(alt, title)}, amenities, sustainabilityFeatures, rating, location}`
  - Query (preview): same filter but omit the published-only clause to return drafts for authenticated editors.
  - Draft/preview: support preview mode to render drafts for authenticated editors. Cache policy: ISR with revalidate=60
 - Add on-demand revalidation via Sanity webhook on publish/update to minimize stale content.

## Acceptance Criteria
- Visiting `/listings/:slug` shows full listing with images, map centered at coordinates, and sustainability metrics
- Page is SEO-friendly with proper meta tags and structured data
- Images use Sanity's image pipeline with `alt` text and hotspot
- Unit tests for ListingCard and ListingGallery
- E2E test: open a listing and verify gallery and map load
