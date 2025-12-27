<!-- markdownlint-disable-file -->
# Task Research Notes: Populate openspec/project.md (stack/tooling/conventions/workflows)

## Research Executed

### File Analysis
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/package.json
  - Root monorepo scripts, pnpm version, shared deps/devDeps, and test/lint commands.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/pnpm-workspace.yaml
  - Workspace members: app-next-directory + sanity.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/biome.json
  - Biome formatter/linter rules, overrides, and file includes.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/AGENTS.md
  - Repo-wide guidance: structure, commands, conventions, and PR workflow.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/docs/reference/CONTRIBUTING.md
  - Branching model, commit message convention, PR expectations.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/docs/DEVELOPMENT_GUIDE.md
  - High-level architecture, env var examples, CI/pre-commit overview.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/docs/BIOME_INTEGRATION_STATUS.md
  - Verified Biome integration details and CI/pre-commit steps.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/.husky/pre-commit
  - Pre-commit quality gates: biome format, app type-check, biome lint fix.

- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/package.json
  - Next.js app deps/devDeps including versions, scripts for unit/integration/e2e.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/next.config.ts
  - Next.js config (typed): cacheComponents, reactStrictMode true, webpack alias for @ -> src, redirects, image remotePatterns.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/next.config.mjs
  - Alternative Next.js config emphasizing Turbopack root + resolveAlias, serverExternalPackages, env enforcement for NEXT_PUBLIC_API_URL.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/eslint.config.mjs
  - ESLint flat config + Next core-web-vitals/typescript, custom rule, jest plugin config, and ignore patterns.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/tsconfig.json
  - TS strictness, path aliases (@/*, @tests/*, @mocks/*), and stricter flags.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/playwright.config.ts
  - E2E config: testMatch under tests/e2e, dev server env overrides, disable external services.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/jest.config.cjs
  - Unit test config: next/jest base, moduleNameMapper mocks, msw patterns, integration gating via env vars.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/jest.integration.config.cjs
  - Integration test config: node env, *.integration.test + *.int.test patterns.

- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/docs/app-next-directory/TESTING.md
  - High-level testing guide (Playwright focus).
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/docs/testing/README.md
  - Detailed testing guide: directory layout, naming, and commands.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/docs/testing/TEST_ARCHITECTURE.md
  - Test architecture narrative; includes a version table (may diverge from package.json).
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/docs/MSW_SANITY_SUMMARY.md
  - Documented MSW strategy for Sanity-backed API tests (search).
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/docs/PRERENDER_API_GUARDS.md
  - Build/prerender guard strategy; env flags to disable external services during build.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/docs/CACHING_STRATEGY.md
  - Upstash Redis caching layer + TTL/SWR/tag invalidation and ISR notes.
- /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory/app-next-directory/docs/NAMING_CONVENTIONS.md
  - Naming conventions + GROQ field aliasing guidance.

### Code Search Results
- husky|pre-commit|lint-staged
  - Matches found in .husky/pre-commit, docs/DEVELOPMENT_GUIDE.md, docs/BIOME_INTEGRATION_STATUS.md, app-next-directory/package.json.
- MONGODB_URI|SANITY|NEXTAUTH|UPSTASH|VERCEL
  - Matches found in docs/DEVELOPMENT_GUIDE.md (env examples), app-next-directory/playwright.config.ts (E2E env), app-next-directory/docs/* (build guards/MSW summaries).

### External Research
- #githubRepo:"" 
  - Not executed (workspace-only request).
- #fetch:
  - Not executed (workspace-only request).

### Project Conventions
- Standards referenced: Biome (formatter/linter), ESLint flat config, TypeScript strict configs, pnpm workspaces scripts.
- Instructions followed: research-only changes restricted to .copilot-tracking/research/.

## Key Discoveries

### Project Structure
- Monorepo via pnpm workspaces: root has workspaces ["app-next-directory", "sanity"] and pnpm-workspace.yaml lists the same.
- Next app lives under app-next-directory/; Sanity Studio/config under sanity/.

### Implementation Patterns
- TypeScript strict enabled in both root and app tsconfigs ("strict": true).
- Import aliasing:
  - Root tsconfig maps @/* to app-next-directory/src/* and @sanity/* to sanity/*.
  - App tsconfig maps @/* to ./src/* and ./app/*, plus @tests/* and @mocks/*.
- Formatting/linting:
  - Biome is configured centrally (lineWidth 100, single quotes, semicolons) and enforces noExplicitAny=error by default, with overrides relaxing test folders.
  - ESLint uses flat config; extends next/core-web-vitals and next/typescript via FlatCompat.

### Complete Examples
```json
// Root workspace + scripts highlights (package.json)
{
  "packageManager": "pnpm@10.15.0",
  "workspaces": ["app-next-directory", "sanity"],
  "scripts": {
    "lint": "biome lint . && pnpm lint:eslint",
    "format": "biome format --write .",
    "test:unit": "pnpm --filter app-next-directory test:unit",
    "test:integration": "pnpm --filter app-next-directory test:integration",
    "test:e2e": "pnpm --filter app-next-directory test:e2e"
  }
}
```

### API and Schema Documentation
- Env var expectations documented:
  - NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET / SANITY_API_TOKEN
  - MONGODB_URI
  - NEXTAUTH_URL / NEXTAUTH_SECRET
  - Optional OAuth provider vars

### Configuration Examples
```bash
# Pre-commit hook (.husky/pre-commit)
pnpm format
cd app-next-directory && pnpm type-check
pnpm lint:biome:fix
```

### Technical Requirements
- E2E runs with external services disabled:
  - Playwright webServer env sets RESEND_API_TOKEN and UPSTASH vars empty.
- Build-time guards exist for prerender scenarios and for disabling external services during build.

## Recommended Approach
Use package.json + config files as the source of truth for versions and commands, and use docs/* to describe intent/policies (testing philosophy, pre-commit/CI, build guards). When docs conflict with package versions (e.g., test architecture tables), prefer package.json/config values and annotate docs as historical.

## Implementation Guidance
- **Objectives**: Fill openspec/project.md with verified stack, tooling, conventions, workflows, and external services.
- **Key Tasks**:
  - Extract versions from root + app package.json.
  - Summarize code-quality gates from biome.json, eslint.config.mjs, tsconfig*.json, and .husky/pre-commit.
  - Summarize test tiers from jest configs, playwright config, and testing docs.
  - Summarize git workflow from docs/reference/CONTRIBUTING.md and AGENTS.md.
  - List external services from deps + env var docs (Sanity, MongoDB, Upstash Redis, Vercel, Resend).
- **Dependencies**: None (documentation-only).
- **Success Criteria**: Each factual statement in openspec/project.md can be traced to a concrete file and a specific setting/dependency/script.
