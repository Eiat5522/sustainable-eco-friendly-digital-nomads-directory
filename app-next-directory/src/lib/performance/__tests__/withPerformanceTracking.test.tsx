import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, render, waitFor } from '@testing-library/react';

jest.mock('@/lib/logger');

let withPerformanceTracking: typeof import('../withPerformanceTracking').withPerformanceTracking;

beforeAll(async () => {
  ({ withPerformanceTracking } = await import('../withPerformanceTracking'));
});

const getWindowPathname = () =>
  typeof window !== 'undefined' ? window.location?.pathname : undefined;

const setPerformanceSequence = (values: number[]) => {
  const queue = [...values];
  const nowMock = jest.fn(() => {
    const next = queue.shift();
    return typeof next === 'number' ? next : (queue[queue.length - 1] ?? 0);
  });
  const perf = { now: nowMock } as unknown as Performance;
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'performance', {
      configurable: true,
      value: perf,
    });
  }
  Object.defineProperty(global, 'performance', {
    configurable: true,
    value: perf,
  });
  return nowMock;
};

describe('withPerformanceTracking', () => {
  const BaseComponent = (props: { label: string }) => <div>{props.label}</div>;
  const originalEnv = process.env;
  const globalWithWindow = global as typeof globalThis & { window?: typeof window };
  const originalWindow = typeof window !== 'undefined' ? globalWithWindow.window : undefined;
  const originalPerformance = global.performance;
  const originalWindowPerformance = typeof window !== 'undefined' ? window.performance : undefined;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    process.env = originalEnv;
    if (originalPerformance) {
      Object.defineProperty(global, 'performance', {
        configurable: true,
        value: originalPerformance,
      });
    } else {
      delete (global as Record<string, unknown>).performance;
    }
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'performance', {
        configurable: true,
        value: originalWindowPerformance,
      });
    }
    if (typeof originalWindow !== 'undefined') {
      globalWithWindow.window = originalWindow;
    } else if ('window' in globalWithWindow) {
      globalWithWindow.window = undefined;
    }
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      delete (global as Record<string, unknown>).fetch;
    }
  });

  it('records render time using the Performance API and forwards the current pathname', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
    const fetchMock = jest.fn(() => Promise.resolve(undefined));
    global.fetch = fetchMock as unknown as typeof fetch;
    const nowMock = setPerformanceSequence([12.3, 44.9]);
    const Wrapped = withPerformanceTracking('Tracked', BaseComponent);

    render(<Wrapped label="hello" />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/performance/custom',
        expect.objectContaining({
          method: 'POST',
          keepalive: true,
          body: expect.any(String),
        })
      );
    });

    const body = fetchMock.mock.calls[0][1]?.body as string;
    expect(JSON.parse(body)).toMatchObject({
      name: 'component-render-Tracked',
      value: 33,
      details: { page: getWindowPathname() },
    });
    // Allow for Strict Mode double invocation
    expect(nowMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('logs debug output in development mode', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
    const fetchMock = jest.fn(() => Promise.resolve(undefined));
    global.fetch = fetchMock as unknown as typeof fetch;
    const nowMock = setPerformanceSequence([100, 160.5]);
    const Wrapped = withPerformanceTracking('Debuggable', BaseComponent);

    render(<Wrapped label="dev" />);

    const mockLogger = jest.requireMock<typeof import('@/lib/logger')>('@/lib/logger');
    await waitFor(() => {
      expect(mockLogger.structuredLogger.debug).toHaveBeenCalledWith(
        '[Component Render] Debuggable',
        {
          component: 'performance',
          durationMs: 60.5,
        }
      );
    });
    expect(mockLogger.structuredLogger.debug).toHaveBeenCalledWith(
      '[Custom Metric] component-render-Debuggable',
      expect.objectContaining({ component: 'performance' })
    );
    const body = fetchMock.mock.calls[0][1]?.body as string;
    expect(JSON.parse(body)).toMatchObject({ value: 61 });
    expect(nowMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('falls back to Date.now when the Performance API is unavailable', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
    const fetchMock = jest.fn(() => Promise.resolve(undefined));
    global.fetch = fetchMock as unknown as typeof fetch;
    Object.defineProperty(global, 'performance', {
      configurable: true,
      value: undefined,
    });
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'performance', {
        configurable: true,
        value: undefined,
      });
    }
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(1_000).mockReturnValueOnce(1_080);
    const Wrapped = withPerformanceTracking('NoPerf', BaseComponent);

    render(<Wrapped label="noop" />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/performance/custom',
        expect.objectContaining({
          body: expect.any(String),
        })
      );
    });
    const body = fetchMock.mock.calls[0][1]?.body as string;
    expect(JSON.parse(body)).toMatchObject({ value: 80 });

    dateSpy.mockRestore();
  });

  it('does not send duplicate metrics when the component rerenders', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
    const fetchMock = jest.fn(() => Promise.resolve(undefined));
    global.fetch = fetchMock as unknown as typeof fetch;
    const nowMock = setPerformanceSequence([10, 25, 41]);
    const Wrapped = withPerformanceTracking('ReRender', BaseComponent);

    const { rerender } = render(<Wrapped label="first" />);
    rerender(<Wrapped label="second" />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(nowMock.mock.calls.length).toBeGreaterThanOrEqual(3);

    const body = fetchMock.mock.calls[0][1]?.body as string;
    expect(JSON.parse(body)).toMatchObject({
      name: 'component-render-ReRender',
      value: 15,
    });
  });

  it('suppresses debug logging outside of development mode', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
    const fetchMock = jest.fn(() => Promise.resolve(undefined));
    global.fetch = fetchMock as unknown as typeof fetch;
    const nowMock = setPerformanceSequence([5, 8.2]);
    const Wrapped = withPerformanceTracking('Silent', BaseComponent);

    render(<Wrapped label="prod" />);

    const mockLogger = jest.requireMock<typeof import('@/lib/logger')>('@/lib/logger');
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(mockLogger.structuredLogger.debug).not.toHaveBeenCalled();
    const body = fetchMock.mock.calls[0][1]?.body as string;
    expect(JSON.parse(body)).toMatchObject({
      name: 'component-render-Silent',
      value: 3,
    });
    expect(nowMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
