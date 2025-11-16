# app-next-directory – Next.js Frontend

This workspace hosts the Next.js 15 App Router frontend for the Sustainable Eco-Friendly Digital Nomads Directory. It consumes Sanity content, MongoDB collections, and Redis-backed services to power listings, search, and authenticated dashboards.

## Current Status (Q1 2025)

- ✅ **Core experience online** – Home, search, listing detail, and dashboard shells are implemented with live data hooks and loading states.
- ✅ **Auth-first routing** – NextAuth.js v5 flows guard dashboards, while role-aware layouts power editor/admin surfaces.
- ✅ **Design system stabilized** – Component library in `src/components/` now drives all new UI work with Tailwind v4 tokens.
- 🔄 **In progress** – Advanced search facets and result ranking are being tuned alongside analytics instrumentation.

Track upcoming milestones in [`docs/reference/CHANGELOG.md`](../docs/reference/CHANGELOG.md).

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

- Workspace documentation lives under [`docs/app-next-directory/`](../docs/app-next-directory/).
- Cross-workspace references (changelog, workspace setup, troubleshooting) are available in [`docs/reference/`](../docs/reference/).
- See [`docs/app-next-directory/README.md`](../docs/app-next-directory/README.md) for navigation, roadmap highlights, and design guidelines.
- **Email Configuration**: See [`docs/EMAIL_CONFIGURATION.md`](docs/EMAIL_CONFIGURATION.md) for setting up contact form email notifications.

## Testing & Quality

Latest verification: `pnpm lint`, `pnpm check-types`, `pnpm test:unit`, and `pnpm test:e2e` (Q1 2025 cycle). For tooling details and test matrices, read [`docs/app-next-directory/TESTING.md`](../docs/app-next-directory/TESTING.md).

## Dependencies & Compatibility

### NextAuth.js v5 Beta
This project uses **NextAuth.js v5.0.0-beta.30** to take advantage of the latest authentication features and improved App Router integration. The beta version is stable for production use, but be aware:
- We're monitoring the [NextAuth.js v5 release roadmap](https://github.com/nextauthjs/next-auth/discussions) for the stable GA release
- The current beta has been thoroughly tested with our authentication flows
- Migration path to stable v5 will be minimal once released
- Alternative: Consider NextAuth.js v4.x if you require only stable releases

### Tailwind CSS
Tailwind CSS v4.x is installed as a **devDependency only** (not in dependencies) as it's a build-time tool that processes styles during the build phase. This reduces install time and keeps the production bundle clean.
