
# System Patterns

**Last Updated:** July 3, 2025

---

## Core Architecture

- Next.js 15.3.2 (App Router, TypeScript)
- Tailwind CSS 4.1.6
- Leaflet.js (client-only interactive maps)
- StaticMapImage (SSR/SEO fallback)
- Sanity CMS (secure, patched, up-to-date)
- MongoDB Atlas (user data)
- NextAuth.js (authentication)

---

## Implementation Patterns

### Map Integration

- Dynamic import for all map components (SSR disabled)
- MapContainer for dynamic loading
- StaticMapImage for SEO fallback
- Client-only map logic
- Marker clustering for performance

### Content Management

- Sanity Studio on project subdomain
- Content models in TypeScript
- Real-time preview via webhooks
- Asset optimization pipeline
- Custom PrismJS patch script
- Security: CSP, CORS, authentication, .env, schema docs

### Component Architecture

- Atomic design principles
- Shadcn-inspired UI components
- Reusable base components
- Mobile-first responsive design
- Optimized loading states

### Testing

- Playwright (E2E, visual, accessibility)
- Jest & React Testing Library (unit/component)
- Unit tests for core utilities (e.g., geocoding)
- API mocking and custom test utilities
- CI via GitHub Actions

---

## Critical Paths

### Content Flow

1. Content created/updated in Sanity Studio
2. Webhooks trigger revalidation
3. Next.js regenerates affected pages
4. CDN cache updated

### Map Rendering

1. Page loads with static map fallback
2. Dynamic map component loads client-side
3. Markers clustered by zoom
4. Interactive features enabled

### Authentication

1. User initiates login
2. NextAuth.js handles provider
3. Session established
4. RBAC enforced

---

## Design Patterns

- Repository (data access)
- Strategy (map providers)
- Observer (real-time updates)
- Factory (component creation)
- Singleton (global state)

---

## Error Handling

- Graceful degradation for map failures
- Retry logic for API calls
- Fallback UI components
- Error boundaries
- Detailed error logging

---

`attempt_completion`
