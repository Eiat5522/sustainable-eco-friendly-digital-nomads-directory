**Overview**

- **Purpose:** Provide a concise Product Requirements Document (PRD) that defines acceptance criteria, high-level flows, test scope, data/environment needs, and success metrics required to bootstrap Testsprite for the `sustainable-eco-friendly-digital-nomads-directory` repository.
- **Context:** The repository contains a Next.js app (`app-next-directory`) with unit, integration, Playwright e2e, and Jest configurations. Testsprite will run generated end-to-end tests against the frontend to validate critical user journeys before CI and local QA.

**Goals**

- **Primary Goal:** Produce a minimal, reviewable PRD that enables generating and running Testsprite test suites.
- **Secondary Goal:** Define clear acceptance criteria and environment setup so bootstrapping is deterministic.

**Stakeholders**

- **Product Owner:** Eiat
- **Engineering / QA:** Frontend team, Test automation
- **DevOps:** CI owners (if environment provisioning required)

**Scope**

- **In-Scope:**
  - Core user flows for city discovery, listing details, and contact/submission flows.
  - Authentication flows (login/logout) if applicable to main journeys.
  - Visual/visual-regression hooks (Percy/Playwright) integration points.
  - Environment and test data requirements for reproducible tests.
- **Out-of-Scope:**
  - Full data migration or backend load testing.
  - Non-critical admin pages or experimental features.

**Assumptions**

- The Next.js app runs locally via `pnpm dev` from `app-next-directory`.
- Playwright is installed and configured; Playwright tests run with `pnpm test:e2e` from `app-next-directory`.
- Testsprite will generate tests based on described flows and use the repository's existing Playwright config where applicable.

**Non-Goals**

- Rewriting existing e2e tests or converting unit tests. Testsprite’s job is to generate and scaffold e2e test files and harness the project’s Playwright setup.

**Functional Requirements**

- **FR-1:** Testsprite must generate e2e tests for the key flows listed in "Test Flows" below.
- **FR-2:** Generated tests must run via the repo's `pnpm test:e2e` Playwright command.
- **FR-3:** Provide configuration or docs for required environment variables (e.g., `NEXT_PUBLIC_API_URL`) and any seed/test DB steps.
- **FR-4:** Tests must include deterministic setup/teardown or mock/stub network interactions (MSW preferred) for CI reliability.

**Non-Functional Requirements**

- **NFR-1:** Tests should be stable (flakiness < 3%); prefer API stubbing for external services.
- **NFR-2:** Tests should run under CI in < 6 minutes for smoke-suite (target).
- **NFR-3:** Generated code must follow repo linting rules (TypeScript strict mode — avoid `any`).

**Test Flows (High Priority)**

- **Flow A — City Search and Details:**
  - Visit homepage, perform a city search (by name or filter), open a city listing, verify key details (name, sustainability tags, images), and confirm map/coordinates display.
  - Acceptance: City detail page shows name, at least one sustainability tag, and working image gallery.

- **Flow B — Save/Bookmark or Favorite Listing (if present):**
  - From listing, click save/bookmark and verify UI state persists (or prompts to login if unauthenticated).
  - Acceptance: UI toggles to saved state and persists across page reload (or proper login flow triggered).

- **Flow C — Contact/Submit Inquiry:**
  - Fill out listing contact form (or newsletter subscribe) and assert success message or backend call stub.
  - Acceptance: UI shows confirmation banner and API request is made (or stubbed) with expected payload.

- **Flow D — Authentication (if applicable):**
  - Sign up / Login happy path using test credentials or mocked provider.
  - Acceptance: Login completes and protected routes are accessible.

**Test Data & Environment**

- **Local Developer:** `pnpm install` then `pnpm dev` in `app-next-directory`.
- **Environment Vars:** Document required envs (e.g., `NEXT_PUBLIC_API_URL`). Provide `scripts/validate-env.js` usage in README.
- **Seed Data:** If tests rely on DB state, provide a script or recommend MSW fixtures to stub APIs. Prefer network mocking to DB seeding for CI stability.

**Acceptance Criteria for PRD**

- PRD reviewed and approved by Eiat.
- Testsprite can generate scaffolded tests and configuration within `tests/` or `app-next-directory/tests/` that run with `pnpm test:e2e`.
- A minimal smoke test suite (Flow A + C) executes locally and in CI using stubs/mocks.

**Risks & Mitigations**

- **Risk:** Flaky tests due to real network/backend dependencies.
  - **Mitigation:** Default to MSW or Playwright route mocking in generated tests.
- **Risk:** Generated tests conflict with TypeScript strictness.
  - **Mitigation:** Ensure generation uses TS types, avoid `any`, and run `pnpm run build:types` as gating step.

**Deliverables**

- `docs/TESTSPRITE_PRD.md` (this file) — formal PRD.
- Generated test scaffold from Testsprite (upon bootstrap) under `app-next-directory/tests/generated-tests/` or equivalent.
- Short README section describing how to run the generated tests and required env/setup.

**Next Steps**

1. Review this PRD and confirm acceptance or requested edits.
2. After approval, I will bootstrap Testsprite to generate the scaffolded e2e tests and a short `README` with run instructions.
3. Run the generated smoke suite locally; iterate until green.

**Files & Commands**

- **Run app locally:**

  ```bash
  cd app-next-directory
  pnpm install
  pnpm dev
  ```

- **Run Playwright e2e:**

  ```bash
  cd app-next-directory
  pnpm install
  pnpm test:e2e
  ```

**Contact**

- Ask: reply here with edits or `approve` to proceed with bootstrapping Testsprite.

---

*Saved to `docs/TESTSPRITE_PRD.md`.*