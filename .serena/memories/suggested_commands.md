# Suggested Commands
## Workspace (root)
- `pnpm install` – install dependencies across all workspaces.
- `pnpm dev` / `pnpm dev:next` / `pnpm dev:sanity` – start both or individual dev servers (:3000 Next.js, :3333 Sanity).
- `pnpm build` / `pnpm build:next` / `pnpm build:sanity` – production builds.
- `pnpm lint` – run ESLint flat config across workspaces.
- `pnpm types:check` – repo-wide TypeScript validation.
- `pnpm test` – delegates to Next.js E2E suites via Playwright.
- `pnpm types:postprocess` – run `sanity-types-postprocess.js` after schema updates.

## Next.js app (`app-next-directory/`)
- `npm run dev` – Next.js dev server.
- `npm run build && npm run start` – production build then serve locally.
- `npm run lint` / `npm run lint:fix` – code quality gate.
- `npm run format` – Prettier pass.
- `npm run types:check` – TypeScript project references check.
- `npm run test:jest` – unit/integration tests (watch via `-- --watch`).
- `npm run test:e2e` / `npm run test:e2e -- --ui|--headed` – Playwright suites (120+ cases).
- `npm run test:coverage` – combined coverage reports.
- `npm run validate:env` – verify required env vars before running.

## Sanity (`sanity/`)
- `npm run dev` – Studio dev server (:3333).
- `npm run build` / `npm run deploy` – prepare/publish Studio.
- `npm run update-types` – regenerate TypeScript types from schemas.
- `npm run import` / `npm run export` – content data workflows.
