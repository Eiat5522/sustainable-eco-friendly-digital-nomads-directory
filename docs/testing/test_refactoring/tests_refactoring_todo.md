# Test Refactoring Initiative To-Do

## Step 1 – Mock External Services (Sanity, MongoDB, Redis)

- [x] Catalogue every test touching external systems (Sanity, MongoDB/Mongoose, Redis) and list findings.
- [x] Add `mongodb-memory-server` to devDependencies and create `tests/utils/dbHandler.ts` with connect/disconnect helpers.
- [x] Wire Jest global setup/teardown to use the in-memory Mongo handler and set `process.env.MONGODB_URI` during tests.
- [ ] Introduce a shared Sanity client mock (e.g., `tests/__mocks__/sanityClient.ts`) and update module mapping so all tests use it.
- [ ] Mock Redis by mapping `ioredis` to `ioredis-mock` in Jest setup and add any required helpers for cache state resets.
- [ ] Refactor existing database-, cache-, and Sanity-dependent tests to rely on the new mocks/in-memory services.
- [ ] Document the mocking approach in `docs/TESTING_GUIDE.md` (or new section) for contributor onboarding.

## Step 2 – Strengthen UI Component Tests

- [ ] Audit component coverage within `app-next-directory/src/components/` and prioritise critical gaps.
- [ ] Ensure RTL dependencies (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`) and jsdom config are present in the Next workspace.
- [ ] Add/shared render utilities wrapping providers, Next router, and auth context stubs for component tests.
- [ ] Author or refactor tests for priority components (listing cards, search, navigation, forms, map/gallery) using RTL interaction patterns.
- [ ] Add edge-case coverage (loading, empty states, error states) for the same priority components.
- [ ] Capture any required component-specific mocks (maps, third-party widgets) under `tests/__mocks__/` and reference them in tests.
- [ ] Update documentation to outline component testing conventions and required utilities.

## Step 3 – Playwright Integration Tests with In-Memory DB

- [ ] Define the initial integration scenarios (e.g., listing create/view, authentication happy path, search flow) and capture prerequisites.
- [ ] Finalise `playwright.config.ts` with webServer settings, testDir, baseURL, retries, and worker strategy for CI vs local.
- [ ] Create or update the `start:test` script to boot Next.js against mongodb-memory-server (ensure deterministic DB URI/port).
- [ ] Implement Playwright global setup/fixtures to seed/clear the in-memory DB and provide auth helpers.
- [ ] Build shared Playwright utilities (login helpers, seeding helpers, API shortcuts) under `tests/e2e/utils/`.
- [ ] Write Playwright specs for the defined scenarios, covering both UI flows and direct API route checks.
- [ ] Configure CI to install Playwright browsers, run the server, execute the e2e suite, and collect traces/screenshots on failure.
- [ ] Document how to run/debug Playwright tests locally, including prerequisite environment variables.

## Step 4 – Test Isolation, Configuration, and Maintainability

- [ ] Consolidate Jest configuration (base config plus project overrides if needed) and ensure moduleNameMapper covers new mocks.
- [ ] Enable `clearMocks`, `resetMocks`, and `restoreMocks` defaults; identify modules needing `jest.resetModules()` between suites.
- [ ] Create shared test factories/fixtures (e.g., listing builder, user builder) to reduce duplicate setup code.
- [ ] Add guardrails against unintended network calls (e.g., fail tests on unmocked fetch/axios usage) in global setup.
- [ ] Review and update CI workflows to split unit/component vs integration jobs with appropriate caching (dependencies, Mongo binaries).
- [ ] Establish a schedule/process to review flaky tests, apply retries where justified, and track follow-up fixes.
- [ ] Update contributor docs with the consolidated testing strategy, including tooling expectations and coding standards for tests.