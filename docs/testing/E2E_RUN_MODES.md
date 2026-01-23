# E2E Run Modes — Local vs Containerized

Last updated: 2026-01-23

This document explains recommended ways to run Playwright E2E tests for this repository: locally during development and containerized for CI or reproducible environments.

## Overview

- Local mode: fastest for iterative development; requires local services (MongoDB, Sanity tokens) or lightweight mocks.
- Containerized mode: recommended for CI and team-shared reproducible runs; uses Docker Compose to start dependent services and ensures environment parity.

## Local mode (developer)

- Prerequisites: Node 18+, pnpm, browsers (Playwright will install when `npx playwright install` runs), local MongoDB instance (or use `mongodb-memory-server`), valid Sanity API token in `/.env.local` if hitting real Sanity.
- Typical commands:
  - `pnpm install`
  - `pnpm dev:next` (start Next dev server)
  - In another terminal: `pnpm test:e2e:local` (or `npx playwright test --project=chromium`)
- Tips:
  - Use `TEST_SANITY_TOKEN` or `SANITY_TOKEN` environment variables for Sanity; avoid committing tokens.
  - If using `mongodb-memory-server`, ensure the test startup waits for the in-memory DB to be ready; increase timeouts if necessary.
  - Use `--grep` to run specific tests: `npx playwright test --grep "login"`.

## Containerized mode (Docker / CI)

- Purpose: provide a reproducible environment with controlled service versions and stable networking.
- Typical flow (Docker Compose):
  1. `docker-compose -f docker-compose.e2e.yml up --build --force-recreate -d`
  2. Wait for services to be healthy (Mongo, Sanity proxy/fixtures)
  3. `pnpm test:e2e:docker` (or run Playwright inside the app container)
  4. `docker-compose -f docker-compose.e2e.yml down`
- Environment & networking tips:
  - Ensure the Playwright container can resolve and connect to the MongoDB and any mocked Sanity endpoints.
  - Use healthchecks and wait-for scripts to guarantee readiness; flaky tests commonly result from services not being ready.
  - Pass Sanity tokens via CI secrets and mount them into the container at runtime.

## Troubleshooting common failures observed in CI and local runs

- MongoDB connection timeouts (e.g., MongooseServerSelectionError):
  - Ensure Mongo is reachable from the test runner container or that `mongodb-memory-server` has finished starting.
  - Increase test connection timeouts and retry logic during startup.
  - Add a small readiness script that polls the Mongo port before launching Playwright.

- Sanity 401 Unauthorized / "Session not found":
  - Verify Sanity token validity and that tokens are passed into the environment where tests execute.
  - For containerized runs, ensure the Sanity mock/proxy is seeded and accessible at the configured base URL.

- Playwright timeouts and flaky assertions:
  - Prefer explicit waits for elements where asynchronous background work is expected (e.g., network revalidation).
  - Use `--retries` in CI to reduce noise while investigating root causes.

## CI Recommendations

- Run E2E in a dedicated pipeline stage after unit and integration tests.
- Use artifacts to store Playwright HTML reports and screenshots on failure (see `tmp/playwright-report` in local runs).
- Fail fast on environment readiness checks; provide clear logs for startup healthcheck failures.

## Commands quick reference

- Local dev run: `pnpm dev:next` then `pnpm test:e2e:local`
- Playwright direct: `npx playwright test --reporter=html` (generates `playwright-report`)
- Docker Compose: `docker-compose -f docker-compose.e2e.yml up --build -d` then `pnpm test:e2e:docker`
