
# System Patterns (Updated: May 15, 2025)

## Core Architecture

- Next.js 15.3.2 (App Router, TypeScript)
- Tailwind CSS 4.1.6
- Leaflet.js for interactive maps (client-only)
- StaticMapImage for SSR/SEO fallback
- Sanity CMS for content management (secure, patched, and up-to-date)
- MongoDB Atlas for user data
- NextAuth.js for authentication

## Implementation Patterns

### Map Integration

- All map components use dynamic import with SSR disabled
- MapContainer handles dynamic loading
- StaticMapImage provides SEO-friendly fallback
- Map logic isolated in client-only components
- Marker clustering for performance


### Content Management

- Sanity Studio hosted on project subdomain
- Content models defined in TypeScript
- Real-time preview using webhooks
- Asset optimization pipeline
- Custom patch script for PrismJS vulnerabilities (see security log)
- Security configuration: CSP, CORS, authentication, .env, schema docs

### Component Architecture

- Atomic design principles
- Shadcn-inspired UI components
- Reusable base components
- Mobile-first responsive design
- Performance-optimized loading states

### Testing Strategy

- Playwright for end-to-end tests
- Component-level unit tests
- API mocking for reliability
- Custom test utilities
- Continuous integration via GitHub Actions

## Critical Implementation Paths

### Content Flow

1. Content created/updated in Sanity Studio
2. Webhooks trigger revalidation
3. Next.js regenerates affected pages
4. CDN cache updated

### Map Rendering

1. Page loads with static map fallback
2. Dynamic map component loads client-side
3. Markers clustered based on zoom level
4. Interactive features enabled

### Authentication Flow

1. User initiates login
2. NextAuth.js handles provider
3. Session established
4. Role-based access enforced

## Design Patterns

- Repository pattern for data access
- Strategy pattern for map providers
- Observer pattern for real-time updates
- Factory pattern for component creation
- Singleton pattern for global state

## Error Handling

- Graceful degradation for map failures
- Retry logic for API calls
- Fallback UI components
- Comprehensive error boundaries
- Detailed error logging
