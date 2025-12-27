```markdown
# Project Context

## Purpose

Sustainable Eco-Friendly Digital Nomads Directory is a pnpm monorepo powering a curated directory of
eco-friendly venues and services for digital nomads (search, maps, listings, authenticated dashboards).
The repo composes a Next.js frontend, a Sanity Studio workspace, and supporting scripts/tests.

## Concrete Tech Stack (repo-verified)

- Monorepo: `pnpm` workspaces (root `package.json` and `pnpm-workspace.yaml`; `packageManager: pnpm@10.15.0`).
- Frontend: Next.js App Router (Next.js 16.1.0) + React 19, TypeScript 5.9.x (app-level `tsconfig.json` uses `strict: true`).
- Styling/UI: Tailwind CSS, Radix primitives and shadcn/ui patterns in the app workspace.
- CMS: Sanity (studio under `sanity/`), with repo `typegen` scripts for Sanity types.
- Auth: NextAuth v5 (beta) + MongoDB adapter.
- Database: MongoDB + Mongoose (app uses mongoose + in-memory patterns for tests).
- Caching/rate-limiting: Upstash Redis + @upstash/ratelimit.
- Testing: Jest (unit/integration) and Playwright (E2E). Biome is used for formatting at root.

Evidence: see `package.json` (root) and `app-next-directory/package.json`, `app-next-directory/tsconfig.json`,
`app-next-directory/playwright.config.ts`.

## Monorepo Layout (important folders)

- `app-next-directory/` — Next.js app, tests, Playwright/Jest configs, scripts, mocks.
- `sanity/` — Sanity Studio and schemas.
- `scripts/`, `docs/`, `tests/`, `coverage/` — repo helpers, documentation, CI artifacts.

## Key runnable commands (copy/paste)

- From repo root (delegates into workspaces):

```bash
pnpm dev:next         # run the Next.js app (filters to app-next-directory)
pnpm build            # runs workspace builds (next + sanity when configured)
pnpm typegen          # regenerate Sanity types and run postprocess
pnpm lint             # biome + eslint checks (root delegates)
pnpm test:unit        # runs unit tests in the app workspace
pnpm test:e2e         # runs Playwright E2E for the app workspace
```

- Directly in `app-next-directory/`:

```bash
pnpm dev              # next dev
pnpm build            # build types then next build
pnpm start            # next start
pnpm test:unit        # jest unit tests (serial by default for CI)
pnpm test:e2e         # playwright test --config=playwright.config.ts
pnpm lint:eslint      # run ESLint for the app
```

See `app-next-directory/package.json` and root `package.json` for exact scripts and postinstall hooks.

## Linting, Formatting, and Type Safety

- Formatting: `biome` at repo root (format + lint flows). `prettier` is present in the app workspace and used
  in lint-staged flows.
- Linting: ESLint with a flat config in `app-next-directory/eslint.config.mjs` (Next.js + TypeScript rules).
- TypeScript: `strict: true` plus aggressive safety flags in `app-next-directory/tsconfig.json`; the codebase forbids
  unchecked `any` usage for production code.

Files: [package.json](package.json#L1-L20), [app-next-directory/tsconfig.json](app-next-directory/tsconfig.json#L1-L40),
[app-next-directory/eslint.config.mjs](app-next-directory/eslint.config.mjs#L1-L40).

## Testing Conventions & CI Rules

- Unit tests: Jest config in `app-next-directory/jest.config.cjs` with Next.js-aware setup and helpers.
- E2E tests: Playwright under `app-next-directory/tests/` and configured in `app-next-directory/playwright.config.ts`.
- CI/testing policy: tests must not hit live external services; use MSW, fixtures, or local stubs. Playwright config
  and AGENTS.md call out that network traffic should be stubbed for deterministic runs.

Files: [app-next-directory/jest.config.cjs](app-next-directory/jest.config.cjs#L1-L40),
[app-next-directory/playwright.config.ts](app-next-directory/playwright.config.ts#L1-L80),
[AGENTS.md](AGENTS.md#L46-L50).

## Developer tooling / scripts

- Sanity typegen: `pnpm typegen` (root delegates to `sanity` workspace and runs `types:postprocess`).
- Playwright and MSW have postinstall helpers in the app workspace (`postinstall` hooks).
- There are helper scripts under `scripts/` (e.g., WSL-safe helpers, e2e Docker helpers).

Files: [package.json](package.json#L48-L52), [app-next-directory/package.json](app-next-directory/package.json#L1-L30),
`scripts/` folder.

## Git & Release Conventions

- Branching: use `develop` as an integration branch; create `feature/*` or `fix/*` branches for work. PRs typically target
  `develop` per repo docs.
- Commit messages follow a concise `type: summary` pattern (feat/fix/docs/chore/test/refactor).

See: [AGENTS.md](AGENTS.md#L114-L116), [README.md](README.md#L45-L49).

## Important Constraints / Policies

- Never commit secrets — use local `.env` files (`app-next-directory/.env.local`, `sanity/.env`).
- Tests and CI must avoid calling live external services (Sanity, Upstash, Resend, etc.).
- When tests alter global instrumentation or `process.on` listeners, call the repo helper that resets instrumentation
  to keep test runs deterministic.

Files: [app-next-directory/src/instrumentation.ts](app-next-directory/src/instrumentation.ts#L140-L170),
[AGENTS.md](AGENTS.md#L46-L50).

---

If you'd like, I can now:

- (A) Add a short `Commands` cheat-sheet file under `docs/` with the exact `pnpm` commands and examples; or
- (B) Open a PR branch and commit this `openspec/project.md` change with a concise commit message. Which do you prefer?

``` 
``` 
