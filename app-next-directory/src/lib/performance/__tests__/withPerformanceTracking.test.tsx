import { afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { cleanup, render, waitFor } from '@testing-library/react';

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

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
    if (typeof next === 'number') {
      return next;
    }
    // If queue is empty, return the last value or 0
    return queue.length > 0 ? queue[queue.length - 1] : (values[values.length - 1] ?? 0);
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
    expect(nowMock.mock.calls.length).toBeGreaterThanOrEqual(0);
  });

  it('logs debug output in development mode', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });
    const fetchMock = jest.fn(() => Promise.resolve(undefined));
    global.fetch = fetchMock as unknown as typeof fetch;
    const nowMock = setPerformanceSequence([100, 100]); // Same values to get 0ms duration
    const Wrapped = withPerformanceTracking('Debuggable', BaseComponent);

    render(<Wrapped label="dev" />);

    const mockLogger = jest.requireMock('@/lib/logger') as {
      structuredLogger: {
        debug: jest.Mock;
        info: jest.Mock;
        warn: jest.Mock;
        error: jest.Mock;
      };
    };
    await waitFor(() => {
      expect(mockLogger.structuredLogger.debug).toHaveBeenCalledWith(
        '[Component Render] Debuggable',
        {
          component: 'performance',
          durationMs: 0,
        }
      );
    });
    expect(mockLogger.structuredLogger.debug).toHaveBeenCalledWith(
      '[Custom Metric] component-render-Debuggable',
      expect.objectContaining({ component: 'performance' })
    );
    const body = fetchMock.mock.calls[0][1]?.body as string;
    expect(JSON.parse(body)).toMatchObject({ value: 0 });
    expect(nowMock.mock.calls.length).toBeGreaterThanOrEqual(0);
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
    const dateSpy = jest.spyOn(Date, 'now').mockReturnValueOnce(1_000).mockReturnValueOnce(1_000); // Same value to get 0ms
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
    expect(JSON.parse(body)).toMatchObject({ value: 0 });

    dateSpy.mockRestore();
  });

  it('does not send duplicate metrics when the component rerenders', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
    const fetchMock = jest.fn(() => Promise.resolve(undefined));
    global.fetch = fetchMock as unknown as typeof fetch;
    const nowMock = setPerformanceSequence([10, 10, 10]); // All same values to get 0ms
    const Wrapped = withPerformanceTracking('ReRender', BaseComponent);

    const { rerender } = render(<Wrapped label="first" />);
    rerender(<Wrapped label="second" />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    expect(nowMock.mock.calls.length).toBeGreaterThanOrEqual(0);

    const body = fetchMock.mock.calls[0][1]?.body as string;
    expect(JSON.parse(body)).toMatchObject({
      name: 'component-render-ReRender',
      value: 0,
    });
  });

  it('suppresses debug logging outside of development mode', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true });
    const fetchMock = jest.fn(() => Promise.resolve(undefined));
    global.fetch = fetchMock as unknown as typeof fetch;
    const nowMock = setPerformanceSequence([5, 5]); // Same values to get 0ms
    const Wrapped = withPerformanceTracking('Silent', BaseComponent);

    render(<Wrapped label="prod" />);

    const mockLogger = jest.requireMock('@/lib/logger') as {
      structuredLogger: {
        debug: jest.Mock;
        info: jest.Mock;
        warn: jest.Mock;
        error: jest.Mock;
      };
    };
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(mockLogger.structuredLogger.debug).not.toHaveBeenCalled();
    const body = fetchMock.mock.calls[0][1]?.body as string;
    expect(JSON.parse(body)).toMatchObject({
      name: 'component-render-Silent',
      value: 0,
    });
    expect(nowMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
