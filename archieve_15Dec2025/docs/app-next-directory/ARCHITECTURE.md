# 🏗️ Architecture Overview – `app-next-directory`

The Next.js workspace powers the public web experience for the Sustainable Eco-Friendly Digital Nomads Directory. It runs on **Next.js 15 App Router with React 19** and composes data from Sanity CMS and MongoDB-backed services through a modular domain architecture. 【F:app-next-directory/package.json†L5-L76】

## Runtime Stack & Conventions
- **App Router-first**: Routes live under `app/` with co-located tests, metadata, and loading states (for example `app/listings/[slug]/page.tsx` and `app/city/[slug]/page.tsx`). 【F:app-next-directory/app/listings/[slug]/page.tsx†L1-L34】【F:app-next-directory/app/city/[slug]/page.tsx†L1-L32】
- **Root layout orchestration**: `app/layout.tsx` injects global theming and wraps all routes with the shared client layout shell. 【F:app-next-directory/app/layout.tsx†L1-L34】
- **TypeScript everywhere**: Shared types and DTO transformers sit under `src/types` and `src/lib/dto-transformer.ts`, while models live in `src/models/`.
- **Strict linting & formatting**: ESLint and TypeScript checks are wired through package scripts (`pnpm lint`, `pnpm check-types`). 【F:app-next-directory/package.json†L9-L43】

## Directory Map
- `app/` – Top-level routes for cities, listings, dashboard, profile, marketing pages, and API handlers (`app/api/**`). 【F:app-next-directory/app/dashboard/page.tsx†L1-L34】【F:app-next-directory/app/api/listings/route.ts†L1-L40】
- `src/components/` – UI primitives, domain components, and layout shells (e.g. `src/components/listings/ListingDetailView.tsx`). 【F:app-next-directory/src/components/listings/ListingDetailView.tsx†L1-L37】
- `src/lib/` – Integrations, analytics, search, and data adapters including Sanity and Redis clients. 【F:app-next-directory/src/lib/sanity/client.ts†L1-L28】【F:app-next-directory/src/lib/redis.ts†L1-L52】
- `src/models/` – Mongoose models for authentication, newsletters, analytics, and review metadata with a dedicated Jest test suite. 【F:app-next-directory/src/models/User.ts†L1-L43】【F:app-next-directory/src/models/__tests__/User.test.ts†L1-L38】
- `tests/e2e/` – Playwright scenarios validating high-value flows (see `pnpm test:e2e`). 【F:app-next-directory/package.json†L22-L42】

## Data Flow
1. **Content ingestion**: Sanity content is queried through the typed GROQ client (`src/lib/sanity/client.ts`) and transformed via DTO helpers before rendering. 【F:app-next-directory/src/lib/sanity/client.ts†L1-L28】【F:app-next-directory/src/lib/dto-transformer.ts†L1-L36】
2. **Dynamic rendering**: ISR is configured per route (`revalidate = 300` on listing detail pages) while metadata is generated alongside page components. 【F:app-next-directory/app/listings/[slug]/page.tsx†L1-L15】
3. **Server actions & API routes**: Route handlers under `app/api/**` expose RESTful endpoints that reuse shared services from `src/lib`. 【F:app-next-directory/app/api/contact/route.ts†L1-L47】
4. **Database writes**: MongoDB access is centralized in `src/lib/dbConnect.ts`, with models defined under `src/models/**`. 【F:app-next-directory/src/lib/dbConnect.ts†L1-L34】【F:app-next-directory/src/models/LoginAttempt.ts†L1-L40】
5. **Caching & rate limiting**: Upstash Redis clients (`src/lib/redis.ts`) back login rate limits and request guards. 【F:app-next-directory/src/lib/redis.ts†L1-L64】
6. **Observability**: Structured logging uses `src/lib/logger.ts` to emit redacted, context-rich events for API routes, middleware, and background tasks. 【F:app-next-directory/src/lib/logger.ts†L1-L213】

## Module Responsibilities
- **Authentication**: NextAuth configuration in `src/lib/auth.ts` powers `/api/auth/[...nextauth]` and downstream helpers (`src/lib/auth/serverAuth.ts`). 【F:app-next-directory/src/lib/auth.ts†L1-L80】【F:app-next-directory/src/lib/auth/serverAuth.ts†L1-L44】
- **Search & discovery**: GROQ queries and highlight helpers live under `src/lib/search.ts` and `src/lib/highlight.tsx`, feeding the search experience in `app/search/page.tsx`.
- **Dashboard & personalization**: Authenticated pages (`app/dashboard/page.tsx`, `app/profile/page.tsx`) use DTO mappers and analytics models to render personalized data. 【F:app-next-directory/app/dashboard/page.tsx†L1-L34】【F:app-next-directory/src/lib/dashboard/user-dashboard.ts†L1-L42】
- **Email & notifications**: Transactional flows are handled by `src/lib/email.ts` and persisted through `src/models/EmailVerificationToken.ts` and `src/models/NewsletterSubscriber.ts`. 【F:app-next-directory/src/lib/email.ts†L1-L42】【F:app-next-directory/src/models/NewsletterSubscriber.ts†L1-L38】

## Testing Status (✅ Completed)
The workspace has a dedicated suite for every layer:
- **Unit tests** cover libraries, models, and utilities (`src/lib/__tests__`, `src/models/__tests__`). 【F:app-next-directory/src/lib/__tests__/dbConnect.integration.test.ts†L1-L32】【F:app-next-directory/src/models/__tests__/ContactSubmission.integration.test.ts†L1-L36】
- **Route tests** validate API handlers and dynamic pages (e.g. `app/city/[slug]/__tests__/page.test.tsx`, `app/api/auth/register/route.test.ts`). 【F:app-next-directory/app/city/[slug]/__tests__/page.test.tsx†L1-L38】【F:app-next-directory/app/api/auth/register/route.test.ts†L1-L52】
- **End-to-end coverage** lives in Playwright specs under `tests/e2e/` with commands exposed in `package.json`. 【F:app-next-directory/package.json†L19-L43】

All suites are wired into the workspace scripts (`pnpm test:unit`, `pnpm test:e2e`, `pnpm lint`, `pnpm check-types`), and the latest testing phase completed with these commands green across CI and local runs.
