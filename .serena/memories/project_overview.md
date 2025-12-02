# Sustainable Eco-Friendly Digital Nomads Directory
- **Purpose**: Monorepo for a curated directory of sustainable, eco-friendly venues and services for digital nomads, pairing vetted listings with rich search/filtering, admin dashboards, analytics, and interactive maps.
- **Core stack**: Next.js 15 App Router (TypeScript, Tailwind, Radix, Framer Motion), Sanity CMS, MongoDB Atlas, NextAuth.js v5, Leaflet/OpenStreetMap, pnpm workspaces.
- **Testing & quality**: Playwright (120+ E2E suites), Jest unit/integration tests, Zod validation, CI via GitHub Actions; coverage and console-error triage reports live in `docs/`.
- **Repo structure**:
  - `app-next-directory/`: Next.js frontend (src, tests, configs, mocks, Playwright setup).
  - `sanity/`: Studio config, schemas, type generation scripts.
  - `docs/`: Consolidated knowledge base (development, deployment, security, testing, API, reference).
  - `scripts/`, `listings/`, `memory-bank/`, `tasks/`: automation, data migrations, context, task tracking.
- **Current status (Q1 2025)**: Core platform stable, documentation unified, automation + deployment ready, awaiting content launch and analytics dashboards.
