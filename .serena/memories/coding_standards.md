# Coding Standards Snapshot
- **TypeScript-first**: No `any`; prefer explicit interfaces, discriminated unions, and type guards. Use type-only imports. Custom hooks prefixed with `use`.
- **Next.js guidance**: Default to Server Components; mark Client components with `use client` only when interactivity demands it. Keep client components small and focused.
- **Formatting & linting**: Prettier + ESLint flat config enforce 2-space indentation, single quotes, <100 char lines, ordered imports (external → internal alias `@/` → relative). Husky blocks commits on violations.
- **Naming**: camelCase variables/functions, PascalCase components/types, kebab-case utility filenames, boolean prefixes `is/has/should`, handlers `handle*`, constants UPPER_SNAKE.
- **Error handling**: Catch and rethrow typed errors, never leak internal error details to users, log server-side, standardize API responses via `NextResponse` helpers.
- **Testing expectations**: Co-locate `*.test.ts[x]`, cover auth, data, edge cases, mock externals, keep Playwright specs under `tests/e2e/` with descriptive names.
- **Comments & docs**: Explain "why" for complex logic, use TODO/FIXME with context or issue refs, prefer removing dead code over commenting it out.
- **Commits**: Conventional Commits (feat/fix/docs/style/refactor/test/chore) in imperative mood, include issue refs where relevant.
