System Architecture:
- Next.js 15.3.2 (App Router, TypeScript)
- Tailwind CSS 4.1.6
- Leaflet.js for interactive maps (client-only)
- StaticMapImage for SSR/SEO fallback

Key Technical Decisions:
- All map components use dynamic import with SSR disabled.
- Listings and images are loaded from local JSON and public/images.
- Map logic is isolated in MapComponent.tsx to ensure client-only execution.

Design Patterns:
- Dynamic import for browser-only libraries.
- Fallback static components for SEO.
- Memory bank documentation after every significant change.

Component Relationships:
- MapContainer dynamically loads MapComponent (Leaflet).
- StaticMapImage is used for SSR/SEO.
- MapComponent is exported as Map in the map index.

Critical Implementation Paths:
- Listings page loads data, passes to MapContainer.
- MapContainer loads MapComponent (client-only).
- MapComponent renders Leaflet map and markers.
