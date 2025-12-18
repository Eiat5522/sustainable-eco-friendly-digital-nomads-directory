TL;DR — Diagnose and fix containerized E2E failures by ensuring production builds and server readiness in Docker, add stronger Playwright readiness checks, and enforce clear test-mode gating so Unit uses mocks, Integration uses an in-memory DB, and E2E runs against a seeded containerized DB. This reduces flakiness and keeps tests isolated.

Steps
1. Audit test configs and scripts
- Review `app-next-directory/playwright.config.ts`, `app-next-directory/jest*.config.cjs`, and `app-next-directory/package.json` to confirm env flags and test targets.

2. Fix Docker build/run
- Update `Dockerfile.e2e` and `run-e2e-docker.sh` to set `NODE_ENV=production`, capture build/start logs to `app-next-directory/test-results/server-start.log`, and verify `.next/static` assets exist post-build.

3. Harden Playwright readiness
- Modify `app-next-directory/playwright.config.ts` to increase `webServer` timeouts and disable `reuseExistingServer` in CI/Docker runs; add an explicit health check for `/_next/static/*` before running tests.

4. Ensure deterministic seed & DB isolation
- Confirm seeding script runs in `run-e2e-docker.sh` and add a pre-Playwright verification (DB query) to confirm seeded data exists; for integration tests use `mongodb-memory-server` and gate with env flags in Jest configs.

5. Improve diagnostics
- Forward Next start logs into mapped `app-next-directory/test-results/` and add asset curl checks to fail-fast with clear diagnostics when assets are missing.

6. Document and add scripts
- Add explicit commands in `app-next-directory/package.json` and repository README for `test:unit` (mocks), `test:integration` (in-memory DB), and `test:e2e` (containerized), plus CI job examples.

Further Considerations
- Decide whether `reuseExistingServer=false` should be applied globally in CI or only in Docker runs.
- If client chunk load errors persist, align Next `assetPrefix` and investigate pnpm workspace symlink behavior during production builds.
- I can draft concrete patches to `Dockerfile.e2e`, `run-e2e-docker.sh`, `app-next-directory/playwright.config.ts`, and `app-next-directory/package.json` when you confirm.

Next actions (pick one)
- I can draft the edits now (apply changes to the files listed above).
- Or I can produce a PR-ready patch with tests and validation commands.

Notes
- File created for iterative refinement. Use this file to add any extra constraints or preferences (e.g., always fail on missing static assets, preferred healthcheck path, CI-specific env names).
