import { jest } from '@jest/globals';

type MockResponse = {
  headers: {
    store: Map<string, string>;
    set: jest.Mock;
    append: jest.Mock;
  };
};

const createMockResponse = (): MockResponse => {
  const store = new Map<string, string>();
  return {
    headers: {
      store,
      set: jest.fn((key: string, value: string) => {
        store.set(key, value);
      }),
      append: jest.fn(),
    },
  };
};

const prepareNextResponseMocks = () => {
  const nextMock = jest.fn(() => createMockResponse());
  const redirectMock = jest.fn(() => createMockResponse());
  const jsonMock = jest.fn(() => createMockResponse());

  jest.doMock('next/server', () => ({
    NextResponse: {
      next: nextMock,
      redirect: redirectMock,
      json: jsonMock,
    },
  }));

  return { nextMock, redirectMock, jsonMock };
};

const loadTsModule = () => {
  const mod = jest.requireActual('../server-timing') as {
    ServerTiming: new () => any;
    middleware: (request: any) => MockResponse;
  };
  return mod;
};

const loadJsModule = () => {
  const mod = jest.requireActual('../server-timing.js') as {
    createServerTiming: () => any;
    serverTimingMiddleware: (request: any, event: any) => MockResponse;
  };
  return mod;
};

describe('ServerTiming middleware (TypeScript implementation)', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('records timings and produces formatted headers', async () => {
    const { nextMock } = prepareNextResponseMocks();
    const nowSpy = jest.spyOn(performance, 'now');
    nowSpy.mockReturnValueOnce(100).mockReturnValueOnce(160);

    const { ServerTiming, middleware } = loadTsModule();

    const timing = new ServerTiming();
    timing.start('database');
    timing.end('database', 'DB query');
    timing.add({ name: 'custom', duration: 42.4242, description: 'Custom metric' });

    const metrics = timing.getMetrics();
    expect(metrics).toHaveLength(2);
    expect(metrics[0]).toEqual(expect.objectContaining({ name: 'database', duration: 60, description: 'DB query' }));
    expect(metrics[1]).toEqual({ name: 'custom', duration: 42.4242, description: 'Custom metric' });
    expect(timing.getMetrics()).not.toBe(metrics);
    expect(timing.getHeaderValue()).toBe('database;dur=60.00;desc="DB query", custom;dur=42.42;desc="Custom metric"');

    nowSpy.mockRestore();

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const response = middleware({} as any);
    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(response.headers.set).toHaveBeenCalledWith('Server-Timing', expect.stringMatching(/^total;dur=\d+\.\d{2}/));
    expect(response.headers.store.get('Server-Timing')).toMatch(/total;dur=\d+\.\d{2};desc="Total server processing time"/);
    expect(logSpy).toHaveBeenCalledWith(
      '[Server Timing]',
      expect.arrayContaining([
        expect.objectContaining({ metric: expect.stringContaining('server_total') }),
      ]),
    );

    process.env.NODE_ENV = originalEnv;
    logSpy.mockRestore();
  });

  it('does not log metrics outside development', async () => {
    prepareNextResponseMocks();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const { middleware } = loadTsModule();
    const response = middleware({} as any);

    expect(response.headers.set).toHaveBeenCalledWith('Server-Timing', expect.any(String));
    expect(logSpy).not.toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
    logSpy.mockRestore();
  });
});

describe('server-timing legacy middleware (JavaScript implementation)', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('skips timing when configuration disables the feature', async () => {
    const { nextMock } = prepareNextResponseMocks();
    jest.doMock('../../lib/performance/monitoring-config', () => ({
      SERVER_TIMING_CONFIG: { enabled: false, verbose: false, operations: [] },
    }));

    const { createServerTiming, serverTimingMiddleware } = loadJsModule();
    const timer = createServerTiming();
    timer.start('total');
    timer.end('total');
    expect(timer.getHeaderValue()).toBe('');

    const response = serverTimingMiddleware({} as any, {} as any);
    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(response.headers.set).toHaveBeenCalledWith('Server-Timing', '');
  });

  it('records and exposes metrics when enabled', async () => {
    const { nextMock } = prepareNextResponseMocks();
    jest.doMock('../../lib/performance/monitoring-config', () => ({
      SERVER_TIMING_CONFIG: { enabled: true, verbose: true, operations: [] },
    }));

    const { createServerTiming, serverTimingMiddleware } = loadJsModule();
    const timer = createServerTiming();
    const nowSpy = jest.spyOn(performance, 'now');
    nowSpy.mockReturnValueOnce(50).mockReturnValueOnce(125);

    timer.start('db');
    timer.end('db', 'query');
    timer.add('manual', 12.3456, 'manual metric');
    const headerValue = timer.getHeaderValue();
    expect(headerValue).toContain('db;dur=');
    expect(headerValue).toContain(';desc="query"');
    expect(headerValue).toContain('manual;dur=12.35;desc="manual metric"');

    const request: Record<string, unknown> = {};
    const response = serverTimingMiddleware(request, {} as any);
    expect(request.serverTiming).toBeDefined();
    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(response.headers.set).toHaveBeenCalledWith('Server-Timing', expect.stringContaining('total;dur='));

    nowSpy.mockRestore();
  });
});
