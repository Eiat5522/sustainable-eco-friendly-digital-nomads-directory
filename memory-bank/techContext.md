
# Technical Context (Updated: May 15, 2025)

## Core Technologies

- Next.js 15.3.2 (App Router, TypeScript)
- Tailwind CSS 4.1.6
- Leaflet.js (interactive maps, client-only)
- StaticMapImage (SSR/SEO fallback)
- Sanity CMS (content management, now secure and up-to-date)
- MongoDB Atlas (user data)
- NextAuth.js (authentication)
- GitHub Actions (CI/CD)
- Vercel (deployment)

## Development Environment

- Node.js 20+
- pnpm or npm
- Windows (pwsh.exe shell)
- VS Code with recommended extensions
- Playwright for testing
- ESLint + Prettier for code quality

## Technical Constraints

- Leaflet.js must not be imported at top level in SSR context
- All map components must be dynamically imported with SSR disabled
- Map logic must be isolated in client-only components
- PrismJS vulnerability in Sanity dependencies is resolved (see security patch log)
- Content updates must trigger page revalidation
- Image optimization required for performance
- Authentication required for protected routes

## Dependencies

### Production

- next
- react
- react-dom
- tailwindcss
- leaflet
- @sanity/client
- mongodb
- next-auth
- lucide-react
- typescript

### Development

- @types/node
- @types/react
- @types/leaflet
- @playwright/test
- eslint
- prettier
- postcss
- autoprefixer

## Tool Usage Patterns

- Dynamic import for browser-only libraries
- Static fallback components for SEO
- Memory bank documentation for changes
- Atomic component design
- Mobile-first development
- Test-driven development
- Continuous integration

## Testing Strategy

### Framework Configuration

- Playwright setup with ES Module support
- Jest and React Testing Library for unit tests
- Custom test utilities:
  - Map interaction helpers (pan, zoom, markers)
  - Filter management utilities
  - Common assertions
  - Test fixtures
  - API mocking setup

### Testing Approach

- End-to-end testing for critical paths
- Component testing for UI elements
- API route testing with mocks
- Performance testing for maps
- Accessibility testing
- Mobile responsiveness verification

## Security Considerations

- Secure API route implementation
- Role-based access control
- Authentication token management
- Environment variable protection
- API key security
- CORS configuration
- Content security policy

## Performance Optimization

- Image optimization pipeline
- Map marker clustering
- Static page generation
- Incremental static regeneration
- Code splitting
- Cache strategies
- Loading state management
