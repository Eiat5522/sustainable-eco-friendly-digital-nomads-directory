What Works:
- Next.js 15.3.2 app scaffolded with Tailwind CSS 4.1.6.
- Listings data and images are loading and display correctly.
- Listing detail page bug fixed.
- Map displays on client (Leaflet.js) with no SSR errors.
- Dynamic import with SSR disabled is implemented for all map components.
- StaticMapImage fallback is in place for SEO.

What's Left:
- Complete image sourcing for all listings.
- Update listings data with correct image paths.
- Integrate interactive map with clustering and performance optimizations.
- CMS integration (Strapi/Sanity).
- Authentication and role-based access (NextAuth.js/Auth0).
- Stripe payment integration.

Known Issues:
- None blocking; SSR error with Leaflet.js is now resolved.

Evolution:
- Moved all Leaflet logic to client-only components.
- Adopted dynamic import with SSR disabled for all map components.
- StaticMapImage used for SEO and fallback.
- Memory bank documentation updated after each significant change.
