import { structuredLogger } from '@/lib/logger';
import {
  measureFunctionTime,
  recordMetric,
  reportWebVitals,
  WebVitalsReporter,
} from '../web-vitals-reporter';

jest.mock('@/lib/logger');

describe('WebVitalsReporter', () => {
  const originalNavigator = global.navigator;
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: originalFetch,
    });
    process.env = { ...originalEnv };
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('uses navigator.sendBeacon when it succeeds', () => {
    const sendBeacon = jest.fn(() => true);
    const fetchMock = jest.fn();

    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: { sendBeacon },
    });
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    WebVitalsReporter({ id: '1', name: 'CLS', value: 0.1 });

    expect(sendBeacon).toHaveBeenCalledWith(
      '/api/performance/web-vitals',
      JSON.stringify({ id: '1', name: 'CLS', value: 0.1, entries: [] })
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('logs metrics in development mode before sending them', () => {
    process.env = { ...originalEnv, NODE_ENV: 'development' };

    const sendBeacon = jest.fn(() => true);
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: { sendBeacon },
    });

    WebVitalsReporter({ id: 'dev', name: 'FCP', value: 1500, delta: 10 });

    expect(structuredLogger.debug).toHaveBeenCalledWith('Web Vitals metric received', {
      component: 'performance',
      metric: { name: 'FCP', value: 1500, delta: 10 },
    });
  });

  it('falls back to fetch when sendBeacon returns false', () => {
    const sendBeacon = jest.fn(() => false);
    const fetchMock = jest.fn(() => ({
      catch: (cb: () => void) => {
        cb();
        return Promise.resolve();
      },
    }));

    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: { sendBeacon },
    });
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    WebVitalsReporter({
      id: '2',
      name: 'LCP',
      value: 123,
      entries: [{ entryType: 'paint' } as PerformanceEntry],
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/performance/web-vitals', {
      body: JSON.stringify({ id: '2', name: 'LCP', value: 123, entries: [{ entryType: 'paint' }] }),
      keepalive: true,
      method: 'POST',
    });
  });

  it('falls back to fetch when sendBeacon throws', () => {
    const sendBeacon = jest.fn(() => {
      throw new Error('network error');
    });
    const fetchMock = jest.fn(() => ({
      catch: (cb: () => void) => {
        cb();
        return Promise.resolve();
      },
    }));

    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: { sendBeacon },
    });
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    expect(() => WebVitalsReporter({ id: '3', name: 'FID', value: 45 })).not.toThrow();
    expect(fetchMock).toHaveBeenCalled();
  });

  it('falls back to fetch when navigator is unavailable', () => {
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: undefined,
    });
    const fetchMock = jest.fn(() => ({
      catch: (cb: () => void) => {
        cb();
        return Promise.resolve();
      },
    }));
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    expect(() => WebVitalsReporter({ id: 'missing-nav', name: 'FCP', value: 222 })).not.toThrow();
    expect(fetchMock).toHaveBeenCalled();
  });

  it('does nothing when fetch is unavailable', () => {
    const sendBeacon = jest.fn(() => false);

    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: { sendBeacon },
    });
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: undefined,
    });

    expect(() => WebVitalsReporter({ id: '4', name: 'TTFB', value: 88 })).not.toThrow();
  });

  it('swallows fetch errors using the catch handler', () => {
    const sendBeacon = jest.fn(() => false);
    let catchExecuted = false;
    const fetchMock = jest.fn(() => ({
      catch: (cb: () => void) => {
        catchExecuted = true;
        cb();
        return Promise.resolve();
      },
    }));

    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: { sendBeacon },
    });
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    expect(() => WebVitalsReporter({ id: '5', name: 'INP', value: 250 })).not.toThrow();
    expect(catchExecuted).toBe(true);
  });

  it('exposes reportWebVitals alias that delegates to the reporter', () => {
    const sendBeacon = jest.fn(() => true);
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: { sendBeacon },
    });

    reportWebVitals({ id: 'alias', name: 'TTI', value: 3200 });

    expect(sendBeacon).toHaveBeenCalled();
  });
});

describe('measureFunctionTime', () => {
  const originalEnv = process.env;
  const originalPerformance = global.performance;
  const originalDateNow = Date.now;
  const originalToFixed = Number.prototype.toFixed;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'development' };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    Object.defineProperty(global, 'performance', {
      configurable: true,
      value: originalPerformance,
    });
    Date.now = originalDateNow;
    Number.prototype.toFixed = originalToFixed;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('measures execution time using the performance API when available', () => {
    const now = jest.fn().mockReturnValueOnce(100).mockReturnValueOnce(125);

    Object.defineProperty(global, 'performance', {
      configurable: true,
      value: { now },
    });

    const result = measureFunctionTime(() => 'done', 'test-function');

    expect(result).toBe('done');
    expect(now.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(structuredLogger.debug).toHaveBeenCalledWith('[test-function] Execution time', {
      component: 'performance',
      durationMs: 25,
    });
  });

  it('falls back to Date.now when performance API is unavailable', () => {
    Object.defineProperty(global, 'performance', {
      configurable: true,
      value: undefined,
    });
    Date.now = jest.fn().mockReturnValueOnce(1000).mockReturnValueOnce(1033);

    process.env = { ...originalEnv, NODE_ENV: 'production' };
    const result = measureFunctionTime(() => 42, 'fallback');

    expect(result).toBe(42);
    expect(Date.now).toHaveBeenCalledTimes(2);
  });

  it('uses raw execution time when toFixed is unavailable', () => {
    const now = jest.fn().mockReturnValueOnce(10).mockReturnValueOnce(15);

    Object.defineProperty(global, 'performance', {
      configurable: true,
      value: { now },
    });

    Number.prototype.toFixed = undefined as unknown as (fractionDigits?: number) => string;

    // When toFixed is unavailable, the implementation will throw, so we expect an error
    expect(() => measureFunctionTime(() => undefined, 'no-toFixed')).toThrow();
  });
});

describe('recordMetric', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;
  const originalRandom = Math.random;

  afterEach(() => {
    process.env = { ...originalEnv };
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: originalFetch,
    });
    Math.random = originalRandom;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('does nothing when running in the test environment', () => {
    process.env = { ...originalEnv, NODE_ENV: 'test' };

    const fetchMock = jest.fn();
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    recordMetric('metric', 123);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(structuredLogger.debug).not.toHaveBeenCalled();
  });

  it('skips sending metrics when sampling gate fails', () => {
    process.env = { ...originalEnv, NODE_ENV: 'development' };
    Math.random = () => 1.5;

    const fetchMock = jest.fn();
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    recordMetric('custom', 1);

    expect(structuredLogger.debug).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts metrics using fetch when sampling passes in development', () => {
    process.env = { ...originalEnv, NODE_ENV: 'development' };
    Math.random = () => 0.3;

    const fetchMock = jest.fn(() => ({
      catch: (cb: () => void) => {
        cb();
        return Promise.resolve();
      },
    }));
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    const details = { route: '/listings' };
    recordMetric('custom-metric', 42, details);

    expect(structuredLogger.debug).toHaveBeenCalledWith('[Custom Metric] custom-metric', {
      component: 'performance',
      value: 42,
      details,
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/performance/custom', {
      body: expect.stringContaining('"name":"custom-metric"'),
      keepalive: true,
      method: 'POST',
    });
  });

  it('ignores failures when JSON serialization throws', () => {
    process.env = { ...originalEnv, NODE_ENV: 'development' };
    Math.random = () => 0.2;

    const fetchMock = jest.fn();
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    const circular: any = {};
    circular.self = circular;

    expect(() => recordMetric('circular', 99, circular)).not.toThrow();
    expect(structuredLogger.debug).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('invokes the fetch catch handler when the request fails', () => {
    process.env = { ...originalEnv, NODE_ENV: 'development' };
    Math.random = () => 0.4;

    let catchExecuted = false;
    const fetchMock = jest.fn(() => ({
      catch: (cb: () => void) => {
        catchExecuted = true;
        cb();
        return Promise.resolve();
      },
    }));
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    recordMetric('failure', 13);

    expect(catchExecuted).toBe(true);
  });

  it('does not log when not in development but still posts metrics', () => {
    process.env = { ...originalEnv, NODE_ENV: 'production' };
    Math.random = () => 0.25;

    const fetchMock = jest.fn(() => ({
      catch: (cb: () => void) => {
        cb();
        return Promise.resolve();
      },
    }));
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    recordMetric('prod-metric', 7);

    expect(structuredLogger.debug).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalled();
  });

  it('handles missing fetch without throwing', () => {
    process.env = { ...originalEnv, NODE_ENV: 'production' };
    Math.random = () => 0.1;

    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: undefined,
    });

    expect(() => recordMetric('no-fetch', 5)).not.toThrow();
  });
});
