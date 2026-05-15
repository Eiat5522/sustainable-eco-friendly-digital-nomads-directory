# MCP Smoke Test Empty Itineraries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Next.js `/mcp` smoke test accept schema-valid empty `plan_sustainable_workday` itineraries when listing data is unavailable, as long as the response includes explanatory notices.

**Architecture:** Keep the actual itinerary generation unchanged. Move the smoke-test-specific validation into a small reusable helper so the app-side script can enforce one clear contract: empty stops are allowed only when the itinerary still has a valid summary and at least one explanatory notice. Add a regression test for that helper, then update the app smoke script to use it. Leave the standalone `mcp-apps-server` smoke test as the behavioral reference and update docs so they stop implying every itinerary must contain stops.

**Tech Stack:** Node.js ESM, Jest, TypeScript, Next.js app workspace, pnpm.

---

### File Map

- `app-next-directory/scripts/mcp-smoke-test.mjs` - app-facing smoke test entrypoint that currently rejects empty itineraries.
- `app-next-directory/scripts/mcp-smoke-test-validators.mjs` - new shared helper for smoke-test itinerary validation.
- `app-next-directory/scripts/__tests__/mcp-smoke-test-validators.test.ts` - regression test for empty itineraries with explanatory notices.
- `mcp-apps-server/README.md` - live smoke-check documentation that currently overpromises non-empty itineraries.
- `docs/reference/MCP_LOCAL_RUNBOOK.md` - runbook copy that should match the updated smoke-test contract.
- `mcp-apps-server/scripts/mcp-smoke-test.ts` - reference behavior only; do not change unless a later verification run shows drift.

### Task 1: Add a focused regression test for empty itineraries

**Files:**
- Create: `app-next-directory/scripts/mcp-smoke-test-validators.mjs`
- Create: `app-next-directory/scripts/__tests__/mcp-smoke-test-validators.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from '@jest/globals';

describe('mcp smoke test itinerary validation', () => {
  it('accepts empty itineraries when notices explain missing listing data', async () => {
    const { validatePlannedItinerary } = await import('../mcp-smoke-test-validators.mjs');

    expect(() =>
      validatePlannedItinerary({
        city: 'Bangkok',
        generatedAt: '2026-05-15T00:00:00.000Z',
        summary: 'No sustainable workday stops could be planned for Bangkok.',
        stops: [],
        notices: ['No published listings were available for this city.'],
      })
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter app-next-directory exec jest --config=jest.config.cjs --runInBand --passWithNoTests scripts/__tests__/mcp-smoke-test-validators.test.ts -t "accepts empty itineraries"`

Expected: FAIL because `validatePlannedItinerary` does not exist yet.

- [ ] **Step 3: Write the minimal helper implementation**

```js
export const validatePlannedItinerary = itinerary => {
  if (!itinerary || typeof itinerary !== 'object') {
    throw new Error('plan_sustainable_workday did not return structuredContent.itinerary');
  }

  if (typeof itinerary.summary !== 'string' || itinerary.summary.length === 0) {
    throw new Error('itinerary.summary missing');
  }

  if (!Array.isArray(itinerary.stops)) {
    throw new Error('itinerary.stops missing');
  }

  if (!Array.isArray(itinerary.notices)) {
    throw new Error('itinerary.notices missing');
  }

  if (itinerary.stops.length === 0 && itinerary.notices.length === 0) {
    throw new Error('Empty itineraries should explain why no stops were returned');
  }
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter app-next-directory exec jest --config=jest.config.cjs --runInBand --passWithNoTests scripts/__tests__/mcp-smoke-test-validators.test.ts -t "accepts empty itineraries"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app-next-directory/scripts/mcp-smoke-test-validators.mjs app-next-directory/scripts/__tests__/mcp-smoke-test-validators.test.ts
git commit -m "test: cover empty mcp itineraries"
```

### Task 2: Switch the app smoke script to the shared validator

**Files:**
- Modify: `app-next-directory/scripts/mcp-smoke-test.mjs:1-153`

- [ ] **Step 1: Write the failing change in the smoke script**

```js
import { validatePlannedItinerary } from './mcp-smoke-test-validators.mjs';

// ...

const itinerary = extractItinerary(callResult);
assert(itinerary, 'plan_sustainable_workday did not return structuredContent.itinerary');
validatePlannedItinerary(itinerary);
pass('plan_sustainable_workday returned schema-valid itinerary');
```

Remove the hard-coded `assert(Array.isArray(itinerary.stops) && itinerary.stops.length > 0, ...)` check. Keep the render step unchanged so the script still confirms the returned itinerary can be fed into `render_workday_itinerary`.

- [ ] **Step 2: Run the smoke test to verify the old assumption is gone**

Run: `pnpm --filter app-next-directory test:mcp-smoke`

Expected: PASS when `/mcp` returns either a populated itinerary or an empty itinerary with notices.

- [ ] **Step 3: Keep the change minimal**

Do not add planner logic, schema changes, or extra branching. The helper should only enforce the smoke-test contract.

- [ ] **Step 4: Commit**

```bash
git add app-next-directory/scripts/mcp-smoke-test.mjs app-next-directory/scripts/mcp-smoke-test-validators.mjs app-next-directory/scripts/__tests__/mcp-smoke-test-validators.test.ts
git commit -m "fix: tolerate empty mcp itineraries in smoke test"
```

### Task 3: Update docs and verify the standalone reference still matches

**Files:**
- Modify: `mcp-apps-server/README.md:79-90`
- Modify: `docs/reference/MCP_LOCAL_RUNBOOK.md:169-176`

- [ ] **Step 1: Update the live smoke-check docs**

Replace the overpromising text with wording that matches the actual contract:

```md
The smoke test verifies MCP initialization, required tool registration, schema-valid tool responses, that `render_workday_itinerary` accepts the stringified itinerary produced by `plan_sustainable_workday`, and that the compiled widget HTML routes are reachable.

If Sanity variables are missing, listing-backed tools can still return empty results. That is acceptable when `plan_sustainable_workday` returns an empty itinerary with explanatory notices and the payload remains schema-valid.
```

Mirror the same wording in the runbook section for the standalone server.

- [ ] **Step 2: Run the docs-focused validation commands**

Run: `pnpm lint`

Expected: PASS, with the markdown changes remaining formatted and no lint regressions.

- [ ] **Step 3: Verify both smoke tests after the doc update**

Run the app smoke test against the Next.js app:

1. Terminal A: `pnpm dev:next`
2. Terminal B: `MCP_BASE_URL=http://127.0.0.1:3000 pnpm test:mcp-smoke`

Expected: `[done] MCP smoke test passed` even if `plan_sustainable_workday` returns an empty itinerary with notices.

Then verify the standalone server still behaves the same way:

1. Terminal A: `pnpm dev:mcp-apps`
2. Terminal B: `MCP_BASE_URL=http://127.0.0.1:3337 pnpm test:mcp-apps:smoke`

Expected: `[done] MCP Apps smoke test passed` and the empty-itinerary notice check still passes.

- [ ] **Step 4: Commit**

```bash
git add mcp-apps-server/README.md docs/reference/MCP_LOCAL_RUNBOOK.md
git commit -m "docs: clarify empty mcp itinerary behavior"
```

### Task 4: Final verification and handoff

**Files:**
- No new files; verify the three touched areas together.

- [ ] **Step 1: Run the focused unit test again**

Run: `pnpm --filter app-next-directory exec jest --config=jest.config.cjs --runInBand --passWithNoTests scripts/__tests__/mcp-smoke-test-validators.test.ts`

Expected: PASS.

- [ ] **Step 2: Run the app smoke test again**

Run: `pnpm --filter app-next-directory test:mcp-smoke`

Expected: PASS.

- [ ] **Step 3: Run the standalone smoke test again**

Run: `pnpm test:mcp-apps:smoke`

Expected: PASS.

- [ ] **Step 4: Summarize the final diff**

Confirm that the final change set only contains:

```text
app-next-directory/scripts/mcp-smoke-test.mjs
app-next-directory/scripts/mcp-smoke-test-validators.mjs
app-next-directory/scripts/__tests__/mcp-smoke-test-validators.test.ts
mcp-apps-server/README.md
docs/reference/MCP_LOCAL_RUNBOOK.md
```

If anything else changed, stop and inspect it before merging.
