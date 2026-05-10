# Local MCP Runbook

This repository exposes two MCP surfaces that share the same workday planner domain logic:

- **Next.js ChatGPT route** — `http://localhost:3000/mcp`
- **Standalone MCP Apps workspace** — `mcp-apps-server`, usually run on a separate port such as `3337`

## Next.js ChatGPT route

From repository root:

```bash
pnpm dev:next
```

Wait for the app to be available on port `3000`.

### v1 tools (read-only)

Current tool names:

- `search`
- `fetch`
- `plan_sustainable_workday`
- `render_workday_itinerary`

All v1 tools are read-only and non-destructive.

### Minimal JSON-RPC test flow (curl)

Use a single session id for all calls below.

1. Initialize:

```bash
curl -sS http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-03-26' \
  -H 'Mcp-Session-Id: local-dev-session' \
  -d '{
    "jsonrpc": "2.0",
    "id": "init-1",
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
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
  -H 'MCP-Protocol-Version: 2025-03-26' \
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
  -H 'MCP-Protocol-Version: 2025-03-26' \
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
  -H 'MCP-Protocol-Version: 2025-03-26' \
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

## Standalone MCP Apps workspace

Run the standalone server on another port so the ChatGPT route can remain untouched:

```bash
PORT=3337 MCP_URL=http://127.0.0.1:3337 pnpm dev:mcp-apps
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
- compiled widget routes at `/mcp-use/widgets/workday-search` and `/mcp-use/widgets/workday-itinerary`

If Sanity variables are missing, listing-backed tools may return empty results; the validation still passes as long as responses remain schema-valid and include explanatory notices.
