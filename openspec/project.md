# Project Context

## Purpose

Sustainable Eco-Friendly Digital Nomads Directory is a monorepo that powers a curated directory of eco-friendly venues
and services for digital nomads (search, maps, listings, and authenticated dashboards), with Sanity as the CMS and
MongoDB as the primary data store.

## Tech Stack

- **Monorepo**: pnpm workspaces (`app-next-directory/`, `sanity/`)
- **Frontend**: Next.js App Router (currently Next.js 16.1.0), React 19, TypeScript 5.9
- **Styling/UI**: Tailwind CSS v4, Radix UI primitives, shadcn/ui patterns
- **CMS**: Sanity v3 (`sanity/` workspace, `@sanity/client` in app)
- **Auth**: NextAuth.js v5 beta (`next-auth@5.0.0-beta.30`) + `@auth/mongodb-adapter`
- **Database**: MongoDB (`mongodb`) + Mongoose (`mongoose`) (Atlas-style connection via env)
- **Caching / rate limiting**: Upstash Redis (`@upstash/redis`) + `@upstash/ratelimit`
- **Maps**: Leaflet + react-leaflet (OpenStreetMap tiles)
- **Email**: Resend (`resend`), plus `nodemailer` for related flows
- **Analytics**: PostHog (`posthog-js`), Vercel Analytics (`@vercel/analytics`)
- **Testing**: Jest (unit/integration) + React Testing Library, Playwright (E2E)

## Project Conventions

### Code Style

- **TypeScript-first, strict**: `strict: true` and additional safety flags are enabled; avoid type assertions unless
  necessary.
- **No `any`**: `any` is forbidden in production code (Biome enforces `noExplicitAny: error` in most folders).
- **Formatting**:

  - Biome formats the repo (2-space indentation, single quotes, semicolons, line width 100).
  - Prettier is also used in the Next.js workspace via lint-staged for staged files.
- **Naming**:

  - Components/pages in PascalCase; hooks in camelCase prefixed with `use*`; utilities in `src/lib/` or `src/utils/`.
  - Sanity system fields (e.g. `_id`, `_type`) are allowed exceptions where relevant.
- **Imports**:

  - Prefer the `@/` alias in the Next.js app (maps to `app-next-directory/src/*` and `app-next-directory/app/*`).
  - Keep imports aligned with the alias instead of deep relative paths.

### Architecture Patterns

- **Monorepo layout**:

  - Next.js app lives in `app-next-directory/`
  - Sanity Studio lives in `sanity/`
- **Next.js app structure**:

  - Routes and route handlers: `app-next-directory/src/app/`
  - Reusable UI: `app-next-directory/src/components/`
  - Integrations and domain helpers: `app-next-directory/src/lib/`, `app-next-directory/src/utils/`
  - Mocks/test helpers: `app-next-directory/src/tests/`, `app-next-directory/src/test-helpers/`,
    `app-next-directory/src/__mocks__/`
- **Next.js 16 async patterns** (important for tests and server components):

  - Await async pages/layouts before rendering in tests (avoid rendering unresolved Promises).
  - Wrap async/server shells in Suspense where a boundary needs a fallback.
  - Pass request objects through NextAuth helpers when wrapping API handlers.

### Testing Strategy

- **Unit tests**: Jest (Next.js-aware config) + Testing Library for components and utilities.
- **Integration tests**: Jest integration config for Node environment; uses `mongodb-memory-server` patterns where
  applicable.
- **E2E tests**: Playwright under `app-next-directory/tests/e2e/`.
- **CI reliability rules**:

  - Do not hit live external services in tests (Sanity, Upstash, email providers). Prefer MSW/mocks and test fixtures.
  - Keep E2E tests deterministic; stub network traffic and test data per the project testing strategy.

### Git Workflow

- **Branches**: `main` (production), `develop` (integration), plus `feature/*`, `fix/*`, `release/*`.
- **Commits**: Conventional-ish `type: message` (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, etc.).
- **PRs**: Target `develop`, keep PRs small and single-purpose, include validation commands.
- **Pre-merge validation (typical)**: `pnpm lint`, `pnpm check-types`, `pnpm test:unit` (and `pnpm test:e2e` when
  relevant).

## Domain Context

- The product is a curated directory of eco-friendly venues/services for digital nomads.
- Core domain concepts commonly include: listings/venues, cities/regions, sustainability attributes/tags, and search
  and map discovery.
- Auth is role-based; tests and docs reference roles like `user`, `editor`, `venueOwner`, `admin`, `superAdmin`.

## Important Constraints

- **Do not commit secrets**: use local env files (`app-next-directory/.env.local`, `sanity/.env`).
- **Type safety is enforced**: avoid `any`; prefer `unknown` + narrowing or explicit DTOs.
- **Testing must be offline-friendly**: CI should not depend on external APIs/network availability.
- **Keep instrumentation deterministic in tests**: reset instrumentation hooks where tests flip `NODE_ENV`.

## External Dependencies

- Sanity (CMS + content API)
- MongoDB Atlas (primary DB)
- Upstash Redis (cache + rate limiting)
- Vercel (deployment + analytics)
- Resend (email delivery)
- OpenStreetMap/Leaflet ecosystem (maps)
- PostHog (analytics)
