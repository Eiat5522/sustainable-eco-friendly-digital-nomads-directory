import assert from 'node:assert/strict';
import {
  renderWorkdayInputSchema,
  searchToolOutputSchema,
  workdayPlanOutputSchema,
} from '../src/lib/workday-schemas';

const defaultBaseUrl = `http://127.0.0.1:${process.env.PORT ?? '3000'}`;
const MCP_PROTOCOL_VERSION = '2025-06-18';
const baseUrl = (process.env.MCP_BASE_URL ?? defaultBaseUrl).replace(/\/$/, '');
const baseOrigin = new URL(baseUrl).origin;
const endpoint = baseUrl.endsWith('/mcp') ? baseUrl : `${baseUrl}/mcp`;

let nextId = 1;

const logStep = (message: string): void => {
  console.log(`\n[step] ${message}`);
};

const pass = (message: string): void => {
  console.log(`[pass] ${message}`);
};

const parseEventStreamEnvelope = (payload: string): unknown => {
  const data = payload
    .split('\n')
    .filter(line => line.startsWith('data: '))
    .map(line => line.slice(6))
    .join('\n')
    .trim();

  assert(data.length > 0, `Expected JSON-RPC data frame, received: ${payload}`);
  return JSON.parse(data);
};

const rpc = async (
  method: string,
  params: Record<string, unknown> | undefined,
  sessionId?: string
): Promise<{ result: Record<string, unknown>; sessionId: string }> => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      'mcp-protocol-version': MCP_PROTOCOL_VERSION,
      ...(sessionId ? { 'mcp-session-id': sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: `mcp-apps-smoke-${nextId++}`,
      method,
      ...(params ? { params } : {}),
    }),
  });

  const text = await response.text();
  assert(response.ok, `${method} returned HTTP ${response.status}: ${text}`);

  const envelope = parseEventStreamEnvelope(text) as {
    error?: unknown;
    result?: Record<string, unknown>;
  };

  assert(!envelope.error, `${method} returned RPC error: ${JSON.stringify(envelope.error)}`);
  assert(envelope.result, `${method} returned no result`);

  const resolvedSessionId = response.headers.get('mcp-session-id') ?? sessionId;
  assert(resolvedSessionId, `${method} did not provide an MCP session id`);

  return {
    result: envelope.result,
    sessionId: resolvedSessionId,
  };
};

const fetchHtml = async (path: string): Promise<string> => {
  const response = await fetch(`${baseUrl}${path}`);
  const body = await response.text();
  assert(response.ok, `GET ${path} returned HTTP ${response.status}`);
  assert(
    response.headers.get('content-type')?.includes('text/html'),
    `GET ${path} did not return HTML`
  );
  return body;
};

const assertNoMismatchedLocalhostOrigin = (label: string, value: string): void => {
  if (baseOrigin !== 'http://localhost:3000') {
    assert(
      !value.includes('http://localhost:3000'),
      `${label} should not reference http://localhost:3000 when server origin is ${baseOrigin}`
    );
  }
};

const run = async (): Promise<void> => {
  console.log(`[info] MCP Apps smoke test endpoint: ${endpoint}`);

  logStep('Initialize MCP session');
  const initialize = await rpc('initialize', {
    protocolVersion: MCP_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: {
      name: 'mcp-apps-smoke-test',
      version: '1.0.0',
    },
  });
  pass(`initialize succeeded (${initialize.sessionId})`);

  const serverInfo = initialize.result.serverInfo as Record<string, unknown> | undefined;
  const icons = Array.isArray(serverInfo?.icons)
    ? (serverInfo.icons as Array<Record<string, unknown>>)
    : [];
  assert(icons.length > 0, 'initialize did not advertise app icons');
  for (const icon of icons) {
    assert.equal(typeof icon.src, 'string');
    assert(
      (icon.src as string).startsWith(`${baseOrigin}/`),
      `icon URL ${(icon.src as string) || '<missing>'} should use ${baseOrigin}`
    );
    assertNoMismatchedLocalhostOrigin('icon URL', icon.src as string);
  }
  pass(`initialize advertises icon URLs on ${baseOrigin}`);

  logStep('Verify required tools and widget metadata');
  const toolsList = await rpc('tools/list', {}, initialize.sessionId);
  const tools = Array.isArray(toolsList.result.tools)
    ? (toolsList.result.tools as Array<Record<string, unknown>>)
    : [];
  const requiredTools = ['search', 'fetch', 'plan_sustainable_workday', 'render_workday_itinerary'];

  for (const toolName of requiredTools) {
    assert(
      tools.some(tool => tool.name === toolName),
      `Missing required tool in tools/list: ${toolName}`
    );
  }

  const widgetTools = new Map(
    tools
      .filter(tool => tool.name === 'search' || tool.name === 'render_workday_itinerary')
      .map(tool => [tool.name as string, tool])
  );

  assert.equal(
    widgetTools.get('search')?._meta &&
      typeof (widgetTools.get('search')?._meta as Record<string, unknown>)['ui/resourceUri'],
    'string'
  );
  assert.equal(
    widgetTools.get('render_workday_itinerary')?._meta &&
      typeof (widgetTools.get('render_workday_itinerary')?._meta as Record<string, unknown>)[
        'ui/resourceUri'
      ],
    'string'
  );
  pass(`tools/list includes required MCP Apps tools: ${requiredTools.join(', ')}`);

  logStep('Call search');
  const search = await rpc(
    'tools/call',
    {
      name: 'search',
      arguments: { query: 'eco cafe bangkok' },
    },
    initialize.sessionId
  );
  assert(searchToolOutputSchema.safeParse(search.result.structuredContent).success);
  pass('search returned schema-valid structured content');

  logStep('Call plan_sustainable_workday');
  const plan = await rpc(
    'tools/call',
    {
      name: 'plan_sustainable_workday',
      arguments: { city: 'Bangkok' },
    },
    initialize.sessionId
  );
  const parsedPlan = workdayPlanOutputSchema.safeParse(plan.result.structuredContent);
  assert(parsedPlan.success, 'plan_sustainable_workday returned invalid structured content');
  if (parsedPlan.data.itinerary.stops.length === 0) {
    assert(
      parsedPlan.data.itinerary.notices.length > 0,
      'Empty itineraries should explain why no stops were returned'
    );
  }
  pass('plan_sustainable_workday returned a schema-valid itinerary');

  logStep('Call render_workday_itinerary');
  const render = await rpc(
    'tools/call',
    {
      name: 'render_workday_itinerary',
      arguments: { itinerary: JSON.stringify(parsedPlan.data.itinerary) },
    },
    initialize.sessionId
  );
  assert(renderWorkdayInputSchema.safeParse(render.result.structuredContent).success);
  assert.deepEqual(
    (render.result.structuredContent as { itinerary: unknown }).itinerary,
    parsedPlan.data.itinerary
  );
  pass('render_workday_itinerary accepted the stringified itinerary payload');

  logStep('Fetch compiled widget HTML');
  const searchWidgetHtml = await fetchHtml('/mcp-use/widgets/workday-search');
  const itineraryWidgetHtml = await fetchHtml('/mcp-use/widgets/workday-itinerary');
  assert(searchWidgetHtml.toLowerCase().includes('<!doctype html>'));
  assert(itineraryWidgetHtml.toLowerCase().includes('<!doctype html>'));
  assert(searchWidgetHtml.includes(baseOrigin), 'search widget assets should use server origin');
  assert(
    itineraryWidgetHtml.includes(baseOrigin),
    'itinerary widget assets should use server origin'
  );
  assertNoMismatchedLocalhostOrigin('search widget HTML', searchWidgetHtml);
  assertNoMismatchedLocalhostOrigin('itinerary widget HTML', itineraryWidgetHtml);
  pass('compiled widget routes are reachable');

  console.log('\n[done] MCP Apps smoke test passed');
};

run().catch(error => {
  console.error(
    `[fail] ${error instanceof Error ? error.message : 'Unknown MCP Apps smoke test failure'}`
  );
  process.exitCode = 1;
});
