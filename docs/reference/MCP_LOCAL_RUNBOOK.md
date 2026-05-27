# Local MCP Runbook

This repository exposes two MCP surfaces that share the same workday planner domain logic:

- **Next.js ChatGPT route** — `http://localhost:3000/mcp`
- **Standalone MCP Apps workspace** — `mcp-apps-server`, usually run on a separate port such as `3337`

Recommended separation:

- Keep the ChatGPT App on port `3000`
- Keep the standalone MCP-App server on another port such as `3337`
- Do not point both interfaces at the same runtime URL

## WSL-safe command execution

If you launch commands from Windows PowerShell against the `\\wsl.localhost\...` workspace path,
`pnpm` can fall back to `C:\Windows` and fail to resolve the monorepo. In that case, run commands
through WSL explicitly:

```bash
wsl.exe bash -lc 'cd /home/eiat/projects/sustainable-eco-friendly-digital-nomads-directory && pnpm dev:chatgpt-app'
```

Use the same pattern for `pnpm dev:mcp-apps`, `pnpm test:chatgpt-app:mcp`, and
`pnpm test:mcp-apps:smoke`.

## Next.js ChatGPT route

From repository root:

```bash
pnpm dev:chatgpt-app
```

Wait for the app to be available on port `3000`.

### v1 tools (read-only)

Current tool names:

- `search`
- `fetch`
- `plan_sustainable_workday`
- `render_workday_itinerary`

All v1 tools are read-only and non-destructive.

Use MCP protocol version `2025-06-18` for local smoke checks.

### Minimal JSON-RPC test flow (curl)

Use a single session id for all calls below.

1. Initialize:

```bash
curl -sS http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-06-18' \
  -H 'Mcp-Session-Id: local-dev-session' \
  -d '{
    "jsonrpc": "2.0",
    "id": "init-1",
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": { "name": "curl", "version": "1.0.0" }
    }
  }'
```

2. List tools:

```bash
curl -sS http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-06-18' \
  -H 'Mcp-Session-Id: local-dev-session' \
  -d '{
    "jsonrpc": "2.0",
    "id": "tools-list-1",
    "method": "tools/list",
    "params": {}
  }'
```

3. Call a tool (example: `search`):

```bash
curl -sS http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-06-18' \
  -H 'Mcp-Session-Id: local-dev-session' \
  -d '{
    "jsonrpc": "2.0",
    "id": "tools-call-1",
    "method": "tools/call",
    "params": {
      "name": "search",
      "arguments": { "query": "eco cafe bangkok" }
    }
  }'
```

Optional second call example (`plan_sustainable_workday`):

```bash
curl -sS http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-06-18' \
  -H 'Mcp-Session-Id: local-dev-session' \
  -d '{
    "jsonrpc": "2.0",
    "id": "tools-call-2",
    "method": "tools/call",
    "params": {
      "name": "plan_sustainable_workday",
      "arguments": { "city": "Bangkok" }
    }
  }'
```

4. Render the planned itinerary with the same payload serialized as a string:

```bash
curl -sS http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-06-18' \
  -H 'Mcp-Session-Id: local-dev-session' \
  -d '{
    "jsonrpc": "2.0",
    "id": "tools-call-3",
    "method": "tools/call",
    "params": {
      "name": "render_workday_itinerary",
      "arguments": {
        "itinerary": "{\"city\":\"Bangkok\",\"generatedAt\":\"2026-05-08T01:00:00.000Z\",\"summary\":\"A balanced sustainable workday in Bangkok.\",\"stops\":[],\"notices\":[\"Listing data may be limited without Sanity credentials.\"]}"
      }
    }
  }'
```

Both MCP surfaces accept the `render_workday_itinerary` payload either as a normal JSON object or as the same itinerary serialized to a JSON string, which is useful when a caller forwards tool output through text-only transport.

## Standalone MCP Apps workspace

Create `mcp-apps-server/.env.local` from [`mcp-apps-server/.env.sample`](../../mcp-apps-server/.env.sample)
if you want the server to load local values automatically.

Run the standalone server on a different port so the ChatGPT route can remain untouched:

```bash
pnpm dev:mcp-apps -- --port 3337
```

Then validate it from the repository root:

```bash
pnpm check-types:mcp-apps
pnpm build:mcp-apps
pnpm test:mcp-apps:validate
MCP_BASE_URL=http://127.0.0.1:3337 pnpm test:mcp-apps:smoke
```

The standalone smoke test covers:

- MCP initialization and `tools/list`
- `search`, `plan_sustainable_workday`, and `render_workday_itinerary`
- passing the planned itinerary into `render_workday_itinerary` as a JSON string
- compiled widget routes at `/mcp-use/widgets/workday-search` and `/mcp-use/widgets/workday-itinerary`

If Sanity variables are missing, listing-backed tools may return empty results. That is acceptable when `plan_sustainable_workday` returns an empty itinerary with explanatory notices and the payload remains schema-valid.

The app-side smoke test and the standalone `mcp-apps-server` smoke test now share that expectation.
