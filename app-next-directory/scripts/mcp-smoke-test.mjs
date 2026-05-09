#!/usr/bin/env node

const DEFAULT_BASE_URL = 'http://localhost:3000/mcp';
const baseUrl = (process.env.MCP_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
const endpoint = baseUrl.endsWith('/mcp') ? baseUrl : `${baseUrl}/mcp`;

let nextId = 1;

const logStep = message => {
  console.log(`\n[step] ${message}`);
};

const pass = message => {
  console.log(`[pass] ${message}`);
};

const fail = message => {
  console.error(`[fail] ${message}`);
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const rpc = async (method, params = undefined) => {
  const payload = {
    jsonrpc: '2.0',
    id: nextId++,
    method,
  };

  if (typeof params !== 'undefined') {
    payload.params = params;
  }

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        'mcp-protocol-version': '2025-03-26',
        'mcp-session-id': 'local-dev-session',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new Error(`${method} request failed`, { cause: error });
  }

  const text = await response.text();
  assert(response.ok, `${method} returned HTTP ${response.status}: ${text}`);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${method} returned non-JSON response: ${text}`);
  }

  assert(data && data.jsonrpc === '2.0', `${method} returned invalid JSON-RPC envelope`);
  assert(!data.error, `${method} returned RPC error: ${JSON.stringify(data.error)}`);

  return data.result;
};

const getToolNames = result => {
  const tools = Array.isArray(result?.tools) ? result.tools : [];
  return tools.map(tool => tool?.name).filter(name => typeof name === 'string');
};

const extractItinerary = result => {
  const itinerary = result?.structuredContent?.itinerary;
  if (itinerary && typeof itinerary === 'object') {
    return itinerary;
  }
  return null;
};

const validateItinerary = itinerary => {
  assert(typeof itinerary.summary === 'string' && itinerary.summary.length > 0, 'itinerary.summary missing');
  assert(Array.isArray(itinerary.stops) && itinerary.stops.length > 0, 'itinerary.stops missing/empty');
};

const run = async () => {
  console.log(`[info] MCP smoke test endpoint: ${endpoint}`);

  logStep('Initialize MCP session');
  const initializeResult = await rpc('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: {
      name: 'mcp-smoke-test',
      version: '1.0.0',
    },
  });
  assert(typeof initializeResult === 'object' && initializeResult !== null, 'initialize returned no result');
  pass('initialize succeeded');

  logStep('Verify required tools are listed');
  const toolsListResult = await rpc('tools/list', {});
  const names = getToolNames(toolsListResult);
  const requiredTools = [
    'search',
    'fetch',
    'plan_sustainable_workday',
    'render_workday_itinerary',
  ];

  for (const toolName of requiredTools) {
    assert(names.includes(toolName), `Missing required tool: ${toolName}`);
  }
  pass(`tools/list includes required tools: ${requiredTools.join(', ')}`);

  logStep('Call plan_sustainable_workday for Bangkok');
  const callResult = await rpc('tools/call', {
    name: 'plan_sustainable_workday',
    arguments: { city: 'Bangkok' },
  });

  const itinerary = extractItinerary(callResult);
  assert(itinerary, 'plan_sustainable_workday did not return structuredContent.itinerary');
  validateItinerary(itinerary);
  pass('plan_sustainable_workday returned structured itinerary');

  console.log('\n[done] MCP smoke test passed');
};

run().catch(error => {
  if (error instanceof Error && error.cause instanceof Error) {
    fail(`${error.message} (${error.cause.message})`);
  } else {
    fail(error instanceof Error ? error.message : String(error));
  }
  process.exitCode = 1;
});
