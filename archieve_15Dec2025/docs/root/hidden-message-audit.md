# Hidden Message Audit

This report catalogs TypeScript suppression directives and console overrides that hide runtime feedback. Items are grouped by severity so the team can plan remediation.

## Severity Key
- **High** — Broad suppression that can easily mask regressions or block type safety entirely.
- **Medium** — Targeted suppression that is justified for tests but still worth tightening.
- **Low** — Expected suppressions used to exercise error paths or type-level expectations.

## High Severity

| Location | Hidden Mechanism | Impact | Suggested Next Step |
| --- | --- | --- | --- |
| `app-next-directory/jest.setup.ts` (lines 82-218) | Replaces `console.error`/`console.warn` to silently drop dozens of known error and warning signatures. | Legitimate new failures that match one of the whitelisted substrings will disappear from test output, increasing the chance of missing regressions. | Replace global overrides with scoped log assertions in the suites that expect noise, or make the filters opt-in per test instead of global defaults. |
| `app-next-directory/tests/e2e/api/listing-management-api.spec.ts.disabled` (line 1) | `// @ts-nocheck` disables all type-checking for the suite. | Any API contract drift or misuse goes unnoticed, even if the file is re-enabled in the future. | Convert the file to plain `.js` if types are unnecessary or add proper Playwright typings so the directive can be removed. |
| `app-next-directory/tests/visual/visual-regression.spec.ts` (line 1) | `// @ts-nocheck` disables Playwright typings. | Missed updates to Playwright APIs or helper utils could break the run without compiler feedback. | Align the suite with Playwright’s test typings (e.g., `import { test, expect } from '@playwright/test'`) and drop the directive. |

## Medium Severity

| Location | Hidden Mechanism | Impact | Suggested Next Step |
| --- | --- | --- | --- |
| `app-next-directory/tests/jest.setup.ts` (lines 1-60) | Swaps in spies that swallow every `console.error`/`console.warn`, only re-emitting messages that escape a small whitelist after each test. | Unexpected logs do fail the test, but expanding the whitelist over time will steadily hide noisy regressions. | Keep the whitelist minimal, add comments explaining each entry, and prefer local suppression helpers for suites with known noise. |
| `app-next-directory/src/lib/__tests__/geocode.test.ts` (lines 87 & 271) | Uses `@ts-expect-error` to assign `global.fetch` and stub `mockResolvedValue` on loosely typed mocks. | Relies on unsound casts that could drift if the production signatures change. | Replace with typed helpers (e.g., `as jest.MockedFunction<typeof fetch>`) so the tests stay aligned with runtime contracts. |

## Low Severity

| Location | Hidden Mechanism | Impact | Suggested Next Step |
| --- | --- | --- | --- |
| `app-next-directory/src/hooks/useSearchListings.test.ts` (line 31) | `@ts-expect-error` injects an invalid entry to verify runtime guards. | Strictly scoped to a single value used to assert resilience, so risk is minimal. | Document the intent in the test description and keep it limited to the guard coverage scenario. |
| `app-next-directory/src/types/type-tests/strict-component-type-tests.tsx` (line 26) | `@ts-expect-error` confirms the `StrictComponent` helper flags missing props. | Forms part of a type-only test suite; the directive expresses the expected failure. | No action required unless the type utility changes. |
| `app-next-directory/src/tests/helpers/test-data.test.ts` (line 519) | `@ts-expect-error` temporarily deletes `global.structuredClone` to exercise a fallback. | Localized to a single test to validate resilience when the API is missing. | Leave as-is but ensure the directive remains next to the cleanup logic for clarity. |
