# Testing guide — Unit / Integration / E2E

This document explains how to run tests in three isolated modes and reproduce E2E in Docker with captured logs.

1) Unit (fast, mocks and stubs)

- Purpose: fast developer feedback, uses Jest with local mocks and MSW handlers.

Commands:

pnpm --filter app-next-directory test:unit

Notes:

- Script sets `JEST_UNIT_ONLY=1` so integration tests are ignored.
- Run `pnpm --filter app-next-directory test:unit:fast` for quicker runs during iteration.

1) Integration (in-memory MongoDB)

- Purpose: exercise data access and business logic against an in-memory DB (mongodb-memory-server) without network calls.

Commands:

pnpm --filter app-next-directory test:integration

Notes:

- Script sets `JEST_RUN_INTEGRATION=1` and `JEST_USE_REAL_MONGOOSE=1` to enable integration test paths.
- Integration tests are matched by `*.integration.test.*` or `*.int.test.*` patterns.

1) E2E (Playwright) — Local (non-containerized)

- Purpose: run Playwright Test locally using production build and `next start`.

Steps:

cd app-next-directory
pnpm build
PLAYWRIGHT_BASE_URL=<http://localhost:3000> PLAYWRIGHT_IS_LOCAL=1 pnpm start &
pnpm exec playwright test --config=playwright.config.ts

Notes:

- Playwright webServer in `playwright.config.ts` is configured to start `pnpm start` when `PLAYWRIGHT_IS_LOCAL=1`.
- Use `pnpm exec playwright show-report` to view `playwright-report/index.html` after run.

1) E2E (Containerized) — Repro with Docker (recommended CI flow)

- Purpose: run a production build inside a container alongside MongoDB, capture server logs and test outputs for debugging.

Top-level script (repo root):

bash run-e2e-docker.sh

What it does:

- Builds images using `Dockerfile.e2e` (NODE_ENV=production inside the image).
- Starts `mongodb` service, runs `tests/setup-e2e-db.mjs` to seed data.
- Runs `tests/check-e2e-seed.mjs` to ensure expected seeded collections exist (fails early if empty).
- Verifies `.next/static/chunks` listing into `app-next-directory/test-results/static-listing.txt`.
- Starts `next start` inside the container, captures server output at `app-next-directory/test-results/server-start.log`.
- Runs Playwright and writes `app-next-directory/test-results/test-e2e-output.log` and the Playwright `playwright-report` into the mapped folder.

Inspect results (host):

- HTML report: app-next-directory/playwright-report/index.html
- Server logs: app-next-directory/test-results/server-start.log
- Test output (combined): app-next-directory/test-results/test-e2e-output.log
- Static assets listing: app-next-directory/test-results/static-listing.txt

CI hints (GitHub Actions minimal example)

- Use a job that runs the `run-e2e-docker.sh` script in a runner with Docker available (self-hosted or GitHub-hosted with Docker). Ensure `actions/checkout` and workspace mapping are correct.
- Make sure `pnpm install` and `pnpm build` run in the image (the script currently builds inside the image).

Troubleshooting

- If Playwright navigation times out or client chunk load errors appear:
  - Inspect `server-start.log` for 404s related to `/_next/static` or runtime errors during boot.
  - Ensure `pnpm build` completes successfully and `.next/static` exists.
  - Confirm `NODE_ENV=production` is set during build (Dockerfile.e2e sets this).
  - Re-run `bash run-e2e-docker.sh` and attach `app-next-directory/test-results/*` artifacts for debugging.

Contact

If you want, I can open a PR that adds CI job YAML and small fixes to ensure `pnpm install:playwright:ci` runs in CI before tests. Let me know if you want that.
