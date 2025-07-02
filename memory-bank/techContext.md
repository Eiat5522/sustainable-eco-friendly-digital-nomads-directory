
# Technical Context

**Last Updated:** July 3, 2025

---

## Core Technologies

- Next.js 15.3.2 (App Router, TypeScript)
- Tailwind CSS 4.1.6
- Leaflet.js (client-only interactive maps)
- StaticMapImage (SSR/SEO fallback)
- Sanity CMS (secure, patched, up-to-date)
- MongoDB Atlas (user data)
- NextAuth.js (authentication)
- GitHub Actions (CI/CD)
- Vercel (deployment)

---

## Development Environment

- Node.js 20+
- pnpm or npm
- Windows (pwsh.exe shell)
- VS Code (recommended extensions)
- Playwright (E2E, visual, and accessibility testing)
- ESLint + Prettier (code quality)

---

## Technical Constraints

- Leaflet.js must not be imported at top level in SSR context
- All map components dynamically imported with SSR disabled
- Map logic isolated in client-only components
- PrismJS vulnerability resolved (see security patch log)
- Content updates trigger page revalidation
- Image optimization required for performance
- Authentication enforced for protected routes

---

## Dependencies

**Production:** next, react, react-dom, tailwindcss, leaflet, @sanity/client, mongodb, next-auth, lucide-react, typescript
**Development:** @types/node, @types/react, @types/leaflet, @playwright/test, eslint, prettier, postcss, autoprefixer

---

## Tooling & Patterns

- Dynamic import for browser-only libraries
- Static fallback components for SEO
- Modular memory-bank documentation
- Atomic component design
- Mobile-first, test-driven development
- Continuous integration

---

## Testing Strategy

- Playwright (E2E, visual, accessibility)
- Jest & React Testing Library (unit/component)
- Custom test utilities (map helpers, filter utils, API mocks)
- API route testing with mocks
- Performance and mobile responsiveness verification

---

## Security

- Secure API routes
- Role-based access control (RBAC)
- JWT/session management
- Environment variable protection
- API key security
- CORS and CSP configuration

---

## Performance

- Image optimization pipeline
- Marker clustering for maps
- Static page generation & ISR
- Code splitting, caching, loading state management

---

`attempt_completion`
