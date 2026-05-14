import { GET, OPTIONS, POST } from './route';
import { WORKDAY_WIDGET_RESOURCE } from '@/lib/chatgpt-app/workday-widget';

describe('/mcp route', () => {
  const originalCrypto = globalThis.crypto;

  beforeAll(() => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        ...originalCrypto,
        randomUUID: () => '00000000-0000-4000-8000-000000000000',
      },
    });
  });

  afterAll(() => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: originalCrypto,
    });
  });

  it('responds to CORS preflight', async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('returns a health response for browser GET requests', async () => {
    const response = await GET(
      new Request('http://localhost/mcp', {
        headers: { accept: 'application/json' },
      })
    );

    await expect(response.json()).resolves.toEqual({
      ok: true,
      name: 'sustainable-workday-planner',
    });
  });

  it('handles a basic MCP initialize request', async () => {
    const response = await POST(
      new Request('http://localhost/mcp', {
        method: 'POST',
        headers: {
          accept: 'application/json, text/event-stream',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2025-06-18',
            capabilities: {},
            clientInfo: { name: 'jest', version: '0.0.0' },
          },
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      jsonrpc: '2.0',
      id: 1,
      result: {
        serverInfo: { name: 'sustainable-workday-planner' },
      },
    });
  });

  it('advertises the planner tool input schema', async () => {
    const response = await POST(
      new Request('http://localhost/mcp', {
        method: 'POST',
        headers: {
          accept: 'application/json, text/event-stream',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {},
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    const plannerTool = body.result.tools.find(
      (tool: { name: string }) => tool.name === 'plan_sustainable_workday'
    );

    expect(plannerTool).toBeDefined();
    expect(plannerTool.inputSchema).toMatchObject({
      type: 'object',
      properties: {
        city: { type: 'string' },
      },
      required: ['city'],
    });
  });

  it('lists the ChatGPT widget resource at the stable UI URI', async () => {
    const response = await POST(
      new Request('http://localhost/mcp', {
        method: 'POST',
        headers: {
          accept: 'application/json, text/event-stream',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'resources/list',
          params: {},
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      jsonrpc: '2.0',
      id: 3,
      result: {
        resources: expect.arrayContaining([
          expect.objectContaining({
            uri: WORKDAY_WIDGET_RESOURCE.uri,
            name: WORKDAY_WIDGET_RESOURCE.title,
            mimeType: WORKDAY_WIDGET_RESOURCE.mimeType,
          }),
        ]),
      },
    });
  });

  it('renders a stringified itinerary payload through the MCP route', async () => {
    const response = await POST(
      new Request('http://localhost/mcp', {
        method: 'POST',
        headers: {
          accept: 'application/json, text/event-stream',
          'content-type': 'application/json',
          'mcp-session-id': 'route-test-session',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: {
            name: 'render_workday_itinerary',
            arguments: {
              itinerary: JSON.stringify({
                city: 'Bangkok',
                generatedAt: '2026-05-08T01:00:00.000Z',
                summary: 'A sustainable workday.',
                stops: [],
                notices: [],
              }),
            },
          },
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      jsonrpc: '2.0',
      id: 4,
      result: {
        structuredContent: {
          itinerary: {
            city: 'Bangkok',
            summary: 'A sustainable workday.',
          },
        },
      },
    });
  });
});
