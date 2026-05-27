#!/usr/bin/env node

import smokeTestValidators from './mcp-smoke-test-validators.cjs';

const {
  validatePlannedItinerary,
  validateSearchStructuredContent,
  validateToolWidgetMetadata,
  validateWidgetResource,
} = smokeTestValidators;

const DEFAULT_BASE_URL = 'http://localhost:3000/mcp';
const MCP_PROTOCOL_VERSION = '2025-06-18';
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
        'mcp-protocol-version': MCP_PROTOCOL_VERSION,
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

const getTools = result => (Array.isArray(result?.tools) ? result.tools : []);

const extractItinerary = result => {
  const itinerary = result?.structuredContent?.itinerary;
  if (itinerary && typeof itinerary === 'object') {
    return itinerary;
  }
  return null;
};

const extractJsonTextContent = result => {
  const textPart = Array.isArray(result?.content)
    ? result.content.find(part => part?.type === 'text' && typeof part.text === 'string')
    : null;

  if (!textPart) {
    return null;
  }

  try {
    return JSON.parse(textPart.text);
  } catch {
    return null;
  }
};

const getToolResourceUri = tool => {
  const meta = tool && typeof tool._meta === 'object' && tool._meta ? tool._meta : {};
  const ui = meta.ui && typeof meta.ui === 'object' ? meta.ui : {};
  const resourceUri = ui.resourceUri || meta['ui/resourceUri'] || meta['openai/outputTemplate'];
  return typeof resourceUri === 'string' ? resourceUri : null;
};

const run = async () => {
  console.log(`[info] MCP smoke test endpoint: ${endpoint}`);

  logStep('Initialize MCP session');
  const initializeResult = await rpc('initialize', {
    protocolVersion: MCP_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: {
      name: 'mcp-smoke-test',
      version: '1.0.0',
    },
  });
  assert(
    typeof initializeResult === 'object' && initializeResult !== null,
    'initialize returned no result'
  );
  pass('initialize succeeded');

  logStep('Verify required tools are listed');
  const toolsListResult = await rpc('tools/list', {});
  const tools = getTools(toolsListResult);
  const names = getToolNames(toolsListResult);
  const requiredTools = ['search', 'fetch', 'plan_sustainable_workday', 'render_workday_itinerary'];

  for (const toolName of requiredTools) {
    assert(names.includes(toolName), `Missing required tool: ${toolName}`);
  }
  pass(`tools/list includes required tools: ${requiredTools.join(', ')}`);

  logStep('Verify widget tool metadata and resource');
  validateToolWidgetMetadata(tools, ['render_workday_itinerary']);
  const renderTool = tools.find(tool => tool?.name === 'render_workday_itinerary');
  const resourceUri = getToolResourceUri(renderTool);
  assert(resourceUri, 'render_workday_itinerary did not advertise a widget resource URI');

  const resourceResult = await rpc('resources/read', { uri: resourceUri });
  const resource = Array.isArray(resourceResult?.contents) ? resourceResult.contents[0] : null;
  validateWidgetResource(resource);
  pass('render_workday_itinerary advertises a readable MCP Apps widget resource');

  logStep('Call search for Bangkok workday candidates');
  const searchResult = await rpc('tools/call', {
    name: 'search',
    arguments: { query: 'eco cafe bangkok' },
  });
  const searchContent = searchResult?.structuredContent || extractJsonTextContent(searchResult);
  validateSearchStructuredContent(searchContent);
  pass('search returned valid listing references');

  logStep('Call plan_sustainable_workday for Bangkok');
  const callResult = await rpc('tools/call', {
    name: 'plan_sustainable_workday',
    arguments: { city: 'Bangkok' },
  });

  const itinerary = extractItinerary(callResult);
  assert(itinerary, 'plan_sustainable_workday did not return structuredContent.itinerary');
  validatePlannedItinerary(itinerary);
  pass('plan_sustainable_workday returned structured itinerary');

  logStep('Call render_workday_itinerary with the stringified plan payload');
  const renderResult = await rpc('tools/call', {
    name: 'render_workday_itinerary',
    arguments: { itinerary: JSON.stringify(itinerary) },
  });
  const renderedItinerary = extractItinerary(renderResult);
  assert(renderedItinerary, 'render_workday_itinerary did not return structuredContent.itinerary');
  validatePlannedItinerary(renderedItinerary);
  assert(
    renderedItinerary.summary === itinerary.summary,
    'render_workday_itinerary changed the itinerary summary'
  );
  pass('render_workday_itinerary accepted the stringified itinerary payload');

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
