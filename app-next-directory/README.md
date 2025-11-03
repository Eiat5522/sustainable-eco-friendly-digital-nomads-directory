# app-next-directory – Next.js Frontend

This workspace hosts the Next.js 15 App Router frontend for the Sustainable Eco-Friendly Digital Nomads Directory. It consumes Sanity content, MongoDB collections, and Redis-backed services to power listings, search, and authenticated dashboards.

## Getting Started
```bash
pnpm install
pnpm dev       # http://localhost:3000
pnpm lint      # ESLint + TypeScript checks
pnpm test:unit # Jest unit tests
pnpm test:e2e  # Playwright end-to-end suites
```

Key directories:
- `app/` – App Router pages, layouts, and API route handlers. 【F:app-next-directory/app/dashboard/page.tsx†L1-L34】
- `src/components/` – UI system, domain components, and co-located tests. 【F:app-next-directory/src/components/listings/ListingDetailView.tsx†L1-L36】
- `src/lib/` – Integrations (Sanity, MongoDB, Redis), DTO transformers, and analytics services. 【F:app-next-directory/src/lib/sanity/client.ts†L1-L28】【F:app-next-directory/src/lib/dbConnect.ts†L1-L34】
- `src/models/` – Mongoose models with comprehensive Jest coverage. 【F:app-next-directory/src/models/User.ts†L1-L43】

## Documentation
All workspace documentation now lives under [`docs/app-next-directory/`](../docs/app-next-directory/):
- [`ARCHITECTURE.md`](../docs/app-next-directory/ARCHITECTURE.md) – Module map and runtime overview
- [`ROUTING.md`](../docs/app-next-directory/ROUTING.md) – Page and API route reference
- [`DATA-INFRASTRUCTURE.md`](../docs/app-next-directory/DATA-INFRASTRUCTURE.md) – MongoDB + Redis configuration
- [`AUTHENTICATION.md`](../docs/app-next-directory/AUTHENTICATION.md) – NextAuth and account flows
- [`API_DOCUMENTATION.md`](../docs/app-next-directory/API_DOCUMENTATION.md) – Endpoint catalog

## Testing Status
The latest testing phase completed with `pnpm lint`, `pnpm check-types`, `pnpm test:unit`, and `pnpm test:e2e`. Refer to [`docs/app-next-directory/TESTING.md`](../docs/app-next-directory/TESTING.md) for tooling details.
