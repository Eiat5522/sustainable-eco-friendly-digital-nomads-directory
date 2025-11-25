# Repository Guidelines

## Project Structure & Module Organization
- Root uses `pnpm` workspaces; primary apps live in `app-next-directory/` (Next.js 16, TypeScript) and `sanity/` (Sanity Studio).
- Next app source: `app-next-directory/src` and `app-next-directory/app` for routes/components; shared UI in `app-next-directory/components`; tests in `app-next-directory/tests`; static assets in `app-next-directory/public`.
- Sanity schemas in `sanity/schemaTypes` and `sanity/schemas`; studio config in `sanity/sanity.config.js`.
- Docs and reference material in `docs/`; automation scripts in `scripts/`; generated artifacts (coverage, reports) are ignored from commits.

## Build, Test, and Development Commands
- Install deps: `pnpm install` (use pnpm@10.15.0 per root lockfile).
- Local dev (Next): `pnpm dev` or `pnpm dev:next`; opens the web app with hot reload.
- Local dev (Sanity Studio): `pnpm dev:sanity`.
- Build for production: `pnpm build` (runs Next then Sanity builds).
- Start compiled apps: `pnpm start` (Next) or `pnpm start:sanity`.
- Lint/format: `pnpm lint` (Biome + Next ESLint), quick format-only check: `pnpm format:check`, apply formatting: `pnpm format`.

## Coding Style & Naming Conventions
- Language: TypeScript/React. Prefer functional components and server components where applicable.
- Formatting and linting are enforced by Biome and ESLint; run `pnpm format` before commits.
- Filenames: use kebab-case for route segments and PascalCase for React components; tests mirror source paths with `.test.ts` or `.spec.ts`.
- Keep env-specific values in `.env*` files; never commit secrets.

## Testing Guidelines
- Unit/integration: Jest configurations live under `app-next-directory/jest*`; run `pnpm test`, or scope via `pnpm test:unit` / `pnpm test:integration`.
- End-to-end: Playwright config at `app-next-directory/playwright.config.ts`; run `pnpm test:e2e` (CI-friendly) or `pnpm test:e2e:legacy` when needed.
- Coverage: `pnpm test:coverage` outputs to `coverage/`; keep key flows above existing thresholds before merging.

## Commit & Pull Request Guidelines
- Use Conventional Commit style seen in history (e.g., `feat: ...`, `chore: ...`, `fix: ...`); include issue numbers when applicable.
- Before opening a PR: ensure `pnpm lint` and relevant `pnpm test:*` commands pass; include summary, testing notes, and screenshots for UI-affecting changes.
- Keep PRs focused and small; describe schema or migration impacts clearly (especially for Sanity content changes).

## Security & Configuration Tips
- Do not commit `.env*`, API keys, or database URLs; prefer `.env.local` for personal development.
- When updating Sanity schemas, run `pnpm typegen` to refresh generated types and commit the changes.
- For Docker-based e2e flows, use `run-e2e-docker.sh` or `docker-compose.e2e.yml` after ensuring env vars are set.
