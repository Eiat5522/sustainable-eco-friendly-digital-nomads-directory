# MCP Apps Server workspace

This workspace now provides the phase-1 MCP Apps workday planner slice for the sustainable digital nomads directory.

It coexists with the existing Next.js `/mcp` ChatGPT route:

- `app-next-directory` keeps the current ChatGPT app path.
- `mcp-apps-server` runs the standalone MCP Apps server.

Both paths reuse the shared workday planner domain modules so ChatGPT behavior stays unchanged while the MCP Apps interface gets its own runtime and validation flow.

## Included MCP tools

- `search` — search published sustainable directory listings and browse results in a widget
- `fetch` — fetch one listing by id or slug with normalized details
- `plan_sustainable_workday` — build a sustainable workday itinerary from shared domain logic
- `render_workday_itinerary` — render a browsable itinerary widget for an existing plan

## Shared domain reuse

The MCP Apps server reuses the shared workday-domain planner and listing candidate service from `app-next-directory/src/lib/workday-domain/` so business logic stays aligned with the existing ChatGPT integration.

## Environment

The listing-backed tools expect the same Sanity environment variables used by the app workspace:

- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `SANITY_API_READ_TOKEN` (or `SANITY_API_TOKEN` / `SANITY_TOKEN`)
- optional `NEXT_PUBLIC_FRONTEND_URL` for absolute listing links inside widgets

If those values are missing, the server still starts, but listing search results can be empty.

## Run locally

From the repository root, run:

```bash
pnpm install
pnpm dev:mcp-apps
```

The standalone server defaults to `http://localhost:3000`, so use a different port when you want to run it alongside the Next.js app:

```bash
PORT=3337 MCP_URL=http://127.0.0.1:3337 pnpm dev:mcp-apps
```

Useful local URLs:

- landing page: `http://127.0.0.1:3337/`
- MCP endpoint: `http://127.0.0.1:3337/mcp`
- widget routes:
  - `http://127.0.0.1:3337/mcp-use/widgets/workday-search`
  - `http://127.0.0.1:3337/mcp-use/widgets/workday-itinerary`

## Validation

Run the workspace validation from the repository root:

```bash
pnpm lint
pnpm check-types:mcp-apps
pnpm build:mcp-apps
pnpm test:mcp-apps:validate
```

The schema validation script checks:

- MCP input/output schemas for `search`, `fetch`, `plan_sustainable_workday`, and `render_workday_itinerary`
- widget metadata alignment for `workday-search` and `workday-itinerary`
- workday planner boundary validation such as default values and invalid time ranges

## Live smoke check

Start the standalone server first, then run:

```bash
MCP_BASE_URL=http://127.0.0.1:3337 pnpm test:mcp-apps:smoke
```

The smoke test verifies MCP initialization, required tool registration, schema-valid tool responses, and that the compiled widget HTML routes are reachable.

If Sanity variables are missing, listing-backed tools can still return empty results. That is acceptable as long as the responses stay schema-valid and include notices explaining the missing data.

## Coexisting with the ChatGPT path

Keep using the existing ChatGPT route through the Next.js app:

```bash
pnpm dev:next
```

That route remains available at `http://localhost:3000/mcp`. Run the standalone MCP Apps server on another port when you need both interfaces at the same time.

## Deploy

```bash
pnpm deploy:mcp-apps
```
