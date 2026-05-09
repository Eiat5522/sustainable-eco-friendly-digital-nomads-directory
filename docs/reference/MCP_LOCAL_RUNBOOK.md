# Local MCP Runbook

This project exposes a local MCP endpoint from the Next.js app:

- Endpoint: `http://localhost:3000/mcp`
- Health check: `GET http://localhost:3000/mcp` returns `{ "ok": true, "name": "sustainable-workday-planner" }`

## Start locally

From repository root:

```bash
pnpm dev:next
```

Wait for the app to be available on port `3000`.

## v1 tools (read-only)

Current tool names:

- `search`
- `fetch`
- `plan_sustainable_workday`
- `render_workday_itinerary`

All v1 tools are read-only and non-destructive.

## Minimal JSON-RPC test flow (curl)

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
