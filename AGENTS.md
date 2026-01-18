# AGENT.md

<!-- agent-browser:START -->
## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:

1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes
<!-- agent-browser:END -->

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.
<!-- OPENSPEC:END -->

## Repository Guidelines

## Project Structure & Module Organization

- Monorepo managed by pnpm workspaces; Next.js app lives in `app-next-directory/`, Sanity Studio in `sanity/`.
- Frontend routes sit in `app-next-directory/src/app/`, reusable UI in `app-next-directory/src/components/`, and domain helpers in `app-next-directory/src/lib/` and `app-next-directory/src/utils/`.
- Unit-supporting mocks, fixtures, and helpers live under `app-next-directory/src/tests/`, `app-next-directory/src/test-helpers/`, and `app-next-directory/src/__mocks__/`.
- Playwright suites are in `app-next-directory/tests/e2e/`; shared documentation resides in `docs/`, with specs in `spec/`.

## Build, Test & Development Commands

- `pnpm install` — bootstrap dependencies once per machine.
- `pnpm dev:next` / `pnpm dev:sanity` — run the Next.js app and Sanity Studio locally; use `pnpm dev:clean` after dependency churn.
- `pnpm build`, `pnpm build:next`, `pnpm build:sanity` — generate production bundles.
- `pnpm lint` and `pnpm check-types` — enforce linting with Biome and ESLint and TypeScript with strict mode.
- `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm test:coverage` — Jest and Playwright batteries, plus coverage reporting.

## Coding Style & Naming Conventions

- TypeScript is mandatory; honor the strict configs in each workspace `tsconfig.json`. Usage of `any` type is strictly forbidden, this will cause production build and CI pipeline to fail.
- Prettier (`app-next-directory/.prettierrc`) enforces 2-space indentation, single quotes, trailing commas, and 100-character lines.
- Keep components and pages in PascalCase files, hooks in camelCase prefixed with `use`, and shared utilities in `src/lib/` or `src/utils/`.
- Align imports with the `@/` alias targeting `app-next-directory/src/`; run `pnpm lint` before pushing.

## Testing Guidelines

- Jest drives unit and integration suites located in `app-next-directory/src/__tests__/` and feature directories using the `*.test.ts(x)` pattern.
- Playwright coverage in `tests/e2e/` should stub network traffic per `TESTING_STRATEGY.md`; never hit live APIs in CI.
- Target meaningful coverage with `pnpm test:coverage`; accompany bug fixes with regression tests.
- Update snapshots intentionally and document major fixture changes in PR notes.

## Next.js 16 App Router Patterns

- **Await before rendering async components.** Treat async pages/layouts as promises in tests: call them, await the result, then pass the resolved JSX into `render`. Example:

  ```ts
  const page = await SearchPage({ searchParams: Promise.resolve({}) });
  render(page);
  ```

  This saves you from the `[object Promise]` error when React returns JSX asynchronously and keeps `findBy*` matchers reliable once Suspense resolves.
- **Wrap server/async shells in Suspense.** When a route layer needs to suspend (e.g., fetching session data with `auth()`), isolate the Async portion so the boundary can fall back cleanly:

  ```tsx
  export default function AdminLayout({ children }: Props) {
    return (
      <Suspense fallback={<Loading />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    );
  }

  export async function AdminShell({ children }: Props) {
    const session = await auth();
    if (!isAdmin(session)) redirect('/auth/login');
    return <div>{children}</div>;
  }
  ```

  Tests should call `AdminShell(...)` directly and render the resolved JSX (or expect the redirect error) so Suspense isn’t left unresolved.
- **Pass request objects through NextAuth helpers.** The new NextAuth exports expect `Request` arguments, so your API wrappers must forward them, e.g. `return authGET(request);`. This keeps logging/tests that assert on the request intact and avoids NextAuth runtime mismatches.
- **Treat alert dispatch errors as recoverable but logged.** When any channel fails (console, Slack, webhook), log the failure and return `null`. Tests rely on both `console.error` and the returned `null`, so the service should call `structuredLogger.error` and optionally `console.error` before suppressing the alert.
- **Keep instrumentation registration deterministic.** When tests flip `NODE_ENV` away from `test` to exercise production-only behavior, call `resetInstrumentationForTests()` before/after the run so the shared `process.on` listeners are torn down and the next test can reinitialize cleanly. The helper removes any previous handlers, clears the internal flag, and avoids `MaxListenersExceededWarning`.

  ```ts
  import { register, resetInstrumentationForTests } from '@/instrumentation';

  beforeEach(() => {
    resetInstrumentationForTests();
    jest.spyOn(process, 'on').mockImplementation((event, handler) => {
      listeners[event] = handler;
      return process;
    });
  });

  afterEach(() => {
    resetInstrumentationForTests();
  });
  ```

- **Favor synchronous DOM events for router assertions.** When a client component drives navigation (e.g., pushing `/contact-us` with query params), prefer `fireEvent.change` + `fireEvent.click` plus a `waitFor` on the mock router rather than `userEvent` sequences that can introduce extra microtasks and fake timers. This keeps tests snappy and avoids Jest timeouts while still verifying the final `router.push` arguments.

  ```ts
  fireEvent.change(screen.getByLabelText(/email address/i), {
    target: { value: 'eco.nomad@example.com' },
  });
  fireEvent.click(screen.getByRole('link', { name: /subscribe/i }));
  await waitFor(() => expect(pushMock).toHaveBeenCalledWith(expectedUrl));
  ```

## Commit & Pull Request Guidelines

- Branch from `develop` using `feature/<kebab-case>` or `fix/<kebab-case>` naming.
- Commit messages follow `type: concise summary` (`feat`, `fix`, `docs`, `chore`, etc.) as described in `docs/reference/CONTRIBUTING.md`.
- Pull requests target `develop`, summarize scope, list validation commands, link issues, and include UI screenshots when layouts shift.
- Update `docs/reference/CHANGELOG.md` for user-facing work and ensure lint, type, and relevant tests pass before requesting review.

## Sanity & Configuration Tips

- Regenerate schema types with `pnpm typegen`, then run `pnpm types:postprocess` to sync DTOs.
- Store environment secrets locally (`app-next-directory/.env.local`, `sanity/.env`); do not commit them.
- Use `pnpm validate:specs` after schema or data-model edits to confirm Sanity definitions remain compatible with the app.
