# Agents

## Project Overview

- Monorepo for eco-friendly digital nomad venues/services.
- Major apps: `app-next-directory` (Next.js frontend), `sanity` (Sanity CMS).
- Data: MongoDB Atlas, Sanity schemas, DTOs for type safety.

## Architecture & Data Flow

- Next.js 15+ frontend (`app-next-directory/`): TypeScript, Tailwind CSS, Framer Motion, Radix UI.
- Sanity Studio (`sanity/`): Content management, schema-driven, codegen for TypeScript types.
- DTOs: Defined in `app-next-directory/src/types/appView.ts`, always align with generated Sanity types.
- Listings, user/auth, and admin features use strict RBAC (NextAuth.js).

## Developer Workflows

- Use `pnpm` for all workspace scripts (see `WORKSPACE_SETUP.md`):
  - `pnpm --filter ./app-next-directory dev` – Next.js dev server
  - `pnpm --filter ./sanity dev` – Sanity Studio dev server
  - `pnpm run codegen:sanity` – Regenerate TypeScript types after schema changes
  - `pnpm exec jest` – Run unit tests
  - `pnpm test` – Run Playwright E2E tests
- Store secrets in Vercel/Cloudflare env vars (never in code).
- Use `.npmrc` for workspace config; see root for settings.

## Patterns & Conventions

- API routes: REST-like, under `app-next-directory/src/app/api/*`, strict JSON envelopes.
- DTOs: All data passed between frontend/backend must use DTOs.
- Sanity images: Use helper in `src/components/SanityImage.tsx` for safe rendering, fallback, and accessibility.
- Testing: Playwright for E2E, Jest for unit, Zod for validation.
- All code must pass lint/type checks before PR merge (see CI config).

## Integration Points

- NextAuth.js for authentication and RBAC.
- Leaflet.js for interactive maps.
- Sanity codegen for schema/type alignment.
- Vercel for deployment (auto on merge to `main`).

## Examples

- See `app-next-directory/README.md` for frontend setup.
- See `sanity/README.md` for CMS setup.
- See `docs/API_DOCUMENTATION.md` for endpoint specs.

## Key Files/Directories

- `app-next-directory/src/types/appView.ts` – DTO definitions
- `app-next-directory/src/components/SanityImage.tsx` – Sanity image rendering
- `sanity/sanity.config.ts` – Sanity Studio config
- `docs/` – All project documentation
- `memory-bank/` – Context/session files

## Code Review Checklist

- All images use safe rendering helper.
- API routes follow strict structure.
- DTOs match Sanity types.
- No secrets in code.
- All new code covered by tests.

---

## Dev Environment Tips

- Run `pnpm install` --filter <project_name> to add the package to your workspace so ESLint and TypeScript can see it.
- To run type check `cd app-next-directory` then use `pnpm tsc --noEmit`
- Use 'pnpm exec jest' to execute unit tests in the root folder.
- Check the name field inside each package's package.json to confirm the right name.

## Sanity CLI Proxy Configuration (Windows/PowerShell)

If you need to run the Sanity CLI behind an HTTP proxy (for example, when working in a restricted or remote environment), use the provided PowerShell script to ensure all network requests go through the proxy:

1. Install the `global-agent` package in your project:

   ```powershell
   pnpm add global-agent
   ```

2. Use the `run-sanity-proxy.ps1` script in the project root. This script sets the `GLOBAL_AGENT_HTTP_PROXY` environment variable and runs the Sanity CLI with the required bootstrap:

   ```powershell
   .\run-sanity-proxy.ps1 <sanity-command>
   # Example:
   .\run-sanity-proxy.ps1 start
   ```

   The proxy address is hardcoded as `http://proxy:8080` in the script. Edit the script if you need to change it.
3. For normal (no-proxy) local development, simply run the Sanity CLI as usual (e.g., `pnpm sanity start`).

This setup ensures proxy usage is persistent only when needed and does not affect your local workflow

---

For more details, see the `README.md` and `WORKSPACE_SETUP.md` in the project root.
