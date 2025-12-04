# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by pnpm workspaces; Next.js app lives in `app-next-directory/`, Sanity Studio in `sanity/`.
- Frontend routes sit in `app-next-directory/src/app/`, reusable UI in `app-next-directory/src/components/`, and domain helpers in `app-next-directory/src/lib/` and `app-next-directory/src/utils/`.
- Unit-supporting mocks, fixtures, and helpers live under `app-next-directory/src/tests/`, `app-next-directory/src/test-helpers/`, and `app-next-directory/src/__mocks__/`.
- Playwright suites are in `app-next-directory/tests/e2e/`; shared documentation resides in `docs/`, with specs in `spec/`.

## Build, Test & Development Commands
- `pnpm install` — bootstrap dependencies once per machine.
- `pnpm dev:next` / `pnpm dev:sanity` — run the Next.js app and Sanity Studio locally; use `pnpm dev:clean` after dependency churn.
- `pnpm build`, `pnpm build:next`, `pnpm build:sanity` — generate production bundles.
- `pnpm lint` and `pnpm check-types` — enforce ESLint rules and strict TypeScript.
- `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm test:coverage` — Jest and Playwright batteries, plus coverage reporting.

## Coding Style & Naming Conventions
- TypeScript is mandatory; honor the strict configs in each workspace `tsconfig.json`.
- Prettier (`app-next-directory/.prettierrc`) enforces 2-space indentation, single quotes, trailing commas, and 100-character lines.
- Keep components and pages in PascalCase files, hooks in camelCase prefixed with `use`, and shared utilities in `src/lib/` or `src/utils/`.
- Align imports with the `@/` alias targeting `app-next-directory/src/`; run `pnpm lint` before pushing.

## Testing Guidelines
- Jest drives unit and integration suites located in `app-next-directory/src/__tests__/` and feature directories using the `*.test.ts(x)` pattern.
- Playwright coverage in `tests/e2e/` should stub network traffic per `TESTING_STRATEGY.md`; never hit live APIs in CI.
- Target meaningful coverage with `pnpm test:coverage`; accompany bug fixes with regression tests.
- Update snapshots intentionally and document major fixture changes in PR notes.

## Commit & Pull Request Guidelines
- Branch from `develop` using `feature/<kebab-case>` or `fix/<kebab-case>` naming.
- Commit messages follow `type: concise summary` (`feat`, `fix`, `docs`, `chore`, etc.) as described in `docs/reference/CONTRIBUTING.md`.
- Pull requests target `develop`, summarize scope, list validation commands, link issues, and include UI screenshots when layouts shift.
- Update `docs/reference/CHANGELOG.md` for user-facing work and ensure lint, type, and relevant tests pass before requesting review.

## Sanity & Configuration Tips
- Regenerate schema types with `pnpm typegen`, then run `pnpm types:postprocess` to sync DTOs.
- Store environment secrets locally (`app-next-directory/.env.local`, `sanity/.env`); do not commit them.
- Use `pnpm validate:specs` after schema or data-model edits to confirm Sanity definitions remain compatible with the app.