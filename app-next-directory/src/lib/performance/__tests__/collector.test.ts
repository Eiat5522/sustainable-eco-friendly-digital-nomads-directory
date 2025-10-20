import { describe, it, expect, afterEach, jest } from '@jest/globals';

import {
  dependencies,
  initPerformanceMonitoring,
  markPerformance,
  measurePerformance,
  PERFORMANCE_MARKS,
} from '../collector';

type MetricCallback = ((metric: Record<string, unknown>) => void) | undefined;

const buildMetric = (overrides: Record<string, unknown>) => ({
  name: 'CLS',
  value: 0,
  rating: 'good',
  delta: 0,
  entries: [],
  id: 'metric-id',
  navigationType: 'navigate',
  ...overrides,
});

describe('performance collector', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalDependencies = { ...dependencies };

  afterEach(() => {
    dependencies.window = originalDependencies.window;
    dependencies.global = originalDependencies.global;
    dependencies.onCLS = originalDependencies.onCLS;
    dependencies.onFCP = originalDependencies.onFCP;
    dependencies.onFID = originalDependencies.onFID;
    dependencies.onINP = originalDependencies.onINP;
    dependencies.onLCP = originalDependencies.onLCP;
    dependencies.onTTFB = originalDependencies.onTTFB;
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  it('wires reporters, logs metrics in development, and forwards data to Plausible', () => {
    const callbacks: Record<string, MetricCallback> = {};

    dependencies.onCLS = jest.fn((cb: MetricCallback) => {
      callbacks.CLS = cb;
    });
    dependencies.onFCP = jest.fn((cb: MetricCallback) => {
      callbacks.FCP = cb;
    });
    dependencies.onFID = jest.fn((cb: MetricCallback) => {
      callbacks.FID = cb;
    });
    dependencies.onINP = jest.fn((cb: MetricCallback) => {
      callbacks.INP = cb;
    });
    dependencies.onLCP = jest.fn((cb: MetricCallback) => {
      callbacks.LCP = cb;
    });
    dependencies.onTTFB = jest.fn((cb: MetricCallback) => {
      callbacks.TTFB = cb;
    });

    let observerCallback:
      | ((list: { getEntries: () => Array<Record<string, unknown>> }) => void)
      | undefined;
    const observe = jest.fn();

    class MockPerformanceObserver {
      constructor(callback: (list: { getEntries: () => Array<Record<string, unknown>> }) => void) {
        observerCallback = callback;
      }

      observe = observe;
    }

    const plausible = jest.fn();
    const mark = jest.fn();
    const measure = jest.fn();

    dependencies.window = {
      plausible,
      performance: { mark, measure } as Record<string, unknown>,
      PerformanceObserver: MockPerformanceObserver as unknown,
    } as unknown as Record<string, any>;
    dependencies.global = dependencies.window;

    process.env.NODE_ENV = 'development';
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    initPerformanceMonitoring();

    expect(dependencies.onCLS).toHaveBeenCalledTimes(1);
    expect(dependencies.onFCP).toHaveBeenCalledTimes(1);
    expect(dependencies.onFID).toHaveBeenCalledTimes(1);
    expect(dependencies.onINP).toHaveBeenCalledTimes(1);
    expect(dependencies.onLCP).toHaveBeenCalledTimes(1);
    expect(dependencies.onTTFB).toHaveBeenCalledTimes(1);
    expect(observerCallback).toBeDefined();

    callbacks.CLS?.(buildMetric({ name: 'CLS', value: 0.2 }));
    callbacks.FCP?.(buildMetric({ name: 'FCP', value: 1900 }));
    callbacks.LCP?.(buildMetric({ name: 'LCP', value: 2000 }));
    callbacks.TTFB?.(buildMetric({ name: 'TTFB', value: 1200 }));
    callbacks.FID?.(buildMetric({ name: 'FID', value: 450 }));
    callbacks.INP?.(buildMetric({ name: 'INP', value: 650 }));

    expect(consoleLogSpy).toHaveBeenCalledWith('[Performance] CLS: 0.2 (needs-improvement)');
    expect(plausible).toHaveBeenCalledWith(
      'performance',
      expect.objectContaining({
        props: expect.objectContaining({ metric: 'CLS', rating: 'needs-improvement', value: 0 }),
      }),
    );
    expect(plausible).toHaveBeenCalledWith(
      'performance',
      expect.objectContaining({
        props: expect.objectContaining({ metric: 'LCP', rating: 'good', value: 2000 }),
      }),
    );
    expect(plausible).toHaveBeenCalledWith(
      'performance',
      expect.objectContaining({
        props: expect.objectContaining({ metric: 'TTFB', rating: 'needs-improvement', value: 1200 }),
      }),
    );
    expect(plausible).toHaveBeenCalledWith(
      'performance',
      expect.objectContaining({
        props: expect.objectContaining({ metric: 'FID', rating: 'poor', value: 450 }),
      }),
    );
    expect(plausible).toHaveBeenCalledWith(
      'performance',
      expect.objectContaining({
        props: expect.objectContaining({ metric: 'FCP', rating: 'needs-improvement', value: 1900 }),
      }),
    );
    expect(plausible).toHaveBeenCalledWith(
      'performance',
      expect.objectContaining({
        props: expect.objectContaining({ metric: 'INP', rating: 'poor', value: 650 }),
      }),
    );

    observerCallback?.({
      getEntries: () => [
        { name: 'search-completed', duration: 123, startTime: 5 } as Record<string, unknown>,
      ],
    });

    expect(observe).toHaveBeenCalledWith({ entryTypes: ['mark', 'measure'] });
    expect(plausible).toHaveBeenCalledWith(
      'performance',
      expect.objectContaining({
        props: expect.objectContaining({ metric: 'search-completed', value: 123, rating: 'good' }),
      }),
    );
  });

  it('marks and measures custom timings when the performance API exists', () => {
    const mark = jest.fn();
    const measure = jest.fn();

    dependencies.window = { performance: { mark, measure } as Record<string, unknown> } as Record<string, any>;
    dependencies.global = dependencies.window;

    markPerformance('MAP_INIT');
    expect(mark).toHaveBeenCalledWith(PERFORMANCE_MARKS.MAP_INIT);

    measurePerformance('results-ready', 'MAP_INIT', 'MAP_MARKERS_LOADED');
    expect(measure).toHaveBeenCalledWith(
      'results-ready',
      PERFORMANCE_MARKS.MAP_INIT,
      PERFORMANCE_MARKS.MAP_MARKERS_LOADED,
    );
  });

  it('silently skips marks and measures when the API is unavailable', () => {
    dependencies.window = undefined;
    dependencies.global = undefined;

    expect(() => markPerformance('MAP_INIT')).not.toThrow();
    expect(() => measurePerformance('noop', 'MAP_INIT', 'MAP_MARKERS_LOADED')).not.toThrow();
  });

  it('provides mocked web-vitals callbacks when the real package is absent', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const received: Record<string, Record<string, unknown>> = {};

    originalDependencies.onCLS((metric) => {
      received.CLS = metric as Record<string, unknown>;
    });
    originalDependencies.onFCP((metric) => {
      received.FCP = metric as Record<string, unknown>;
    });
    originalDependencies.onFID((metric) => {
      received.FID = metric as Record<string, unknown>;
    });
    originalDependencies.onINP((metric) => {
      received.INP = metric as Record<string, unknown>;
    });
    originalDependencies.onLCP((metric) => {
      received.LCP = metric as Record<string, unknown>;
    });
    originalDependencies.onTTFB((metric) => {
      received.TTFB = metric as Record<string, unknown>;
    });

    expect(received.CLS).toMatchObject({ name: 'CLS', id: 'mock-cls', value: 0 });
    expect(received.FCP).toMatchObject({ name: 'FCP', id: 'mock-fcp', value: 0 });
    expect(received.FID).toMatchObject({ name: 'FID', id: 'mock-fid', value: 0 });
    expect(received.INP).toMatchObject({ name: 'INP', id: 'mock-inp', value: 0 });
    expect(received.LCP).toMatchObject({ name: 'LCP', id: 'mock-lcp', value: 0 });
    expect(received.TTFB).toMatchObject({ name: 'TTFB', id: 'mock-ttfb', value: 0 });
    expect(warnSpy).toHaveBeenCalledWith('web-vitals package not installed - onCLS is mocked');
    expect(warnSpy).toHaveBeenCalledWith('web-vitals package not installed - onFCP is mocked');
    expect(warnSpy).toHaveBeenCalledWith('web-vitals package not installed - onFID is mocked');
    expect(warnSpy).toHaveBeenCalledWith('web-vitals package not installed - onINP is mocked');
    expect(warnSpy).toHaveBeenCalledWith('web-vitals package not installed - onLCP is mocked');
    expect(warnSpy).toHaveBeenCalledWith('web-vitals package not installed - onTTFB is mocked');

    warnSpy.mockRestore();
  });

  it('falls back to global scope implementations when window APIs are missing', () => {
    const callbacks: Record<string, MetricCallback> = {};

    dependencies.onCLS = jest.fn((cb: MetricCallback) => {
      callbacks.CLS = cb;
    });
    dependencies.onFCP = jest.fn((cb: MetricCallback) => {
      callbacks.FCP = cb;
    });
    dependencies.onFID = jest.fn((cb: MetricCallback) => {
      callbacks.FID = cb;
    });
    dependencies.onINP = jest.fn((cb: MetricCallback) => {
      callbacks.INP = cb;
    });
    dependencies.onLCP = jest.fn((cb: MetricCallback) => {
      callbacks.LCP = cb;
    });
    dependencies.onTTFB = jest.fn((cb: MetricCallback) => {
      callbacks.TTFB = cb;
    });

    const mark = jest.fn();
    const measure = jest.fn();
    const plausible = jest.fn();
    const observe = jest.fn();
    let observerCallback: ((list: { getEntries: () => Array<Record<string, unknown>> }) => void) | undefined;

    class GlobalObserver {
      public observe = observe;

      constructor(callback: (list: { getEntries: () => Array<Record<string, unknown>> }) => void) {
        observerCallback = callback;
      }
    }

    dependencies.window = {} as Record<string, any>;
    dependencies.global = {
      performance: { mark, measure },
      PerformanceObserver: GlobalObserver as unknown,
      plausible,
    } as Record<string, any>;

    process.env.NODE_ENV = 'production';
    initPerformanceMonitoring();

    callbacks.CLS?.(buildMetric({ name: 'CLS', value: 0.07 }));
    expect(plausible).toHaveBeenCalledWith(
      'performance',
      expect.objectContaining({
        props: expect.objectContaining({ metric: 'CLS', value: 0, rating: 'good' }),
      }),
    );

    observerCallback?.({
      getEntries: () => [
        { name: 'custom-metric', duration: 12, startTime: 0 } as Record<string, unknown>,
      ],
    });
    expect(observe).toHaveBeenCalledWith({ entryTypes: ['mark', 'measure'] });

    markPerformance('MAP_INIT');
    expect(mark).toHaveBeenCalledWith(PERFORMANCE_MARKS.MAP_INIT);

    measurePerformance('done', 'MAP_INIT', 'MAP_MARKERS_LOADED');
    expect(measure).toHaveBeenCalledWith(
      'done',
      PERFORMANCE_MARKS.MAP_INIT,
      PERFORMANCE_MARKS.MAP_MARKERS_LOADED,
    );
  });

  it('skips reporting when plausible analytics is unavailable or invalid', () => {
    const callbacks: Record<string, MetricCallback> = {};

    dependencies.onCLS = jest.fn((cb: MetricCallback) => {
      callbacks.CLS = cb;
    });

    dependencies.window = { plausible: 'not-a-function' } as Record<string, any>;
    dependencies.global = {} as Record<string, any>;

    process.env.NODE_ENV = 'production';
    const consoleLogSpy = jest.spyOn(console, 'log');

    initPerformanceMonitoring();

    callbacks.CLS?.(buildMetric({ name: 'CLS', value: 0.05 }));

    expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('[Performance]'));
    consoleLogSpy.mockRestore();
  });

  it('gracefully handles missing performance observers', () => {
    const callbacks: Record<string, MetricCallback> = {};

    dependencies.onCLS = jest.fn((cb: MetricCallback) => {
      callbacks.CLS = cb;
    });

    dependencies.window = {} as Record<string, any>;
    dependencies.global = {} as Record<string, any>;

    process.env.NODE_ENV = 'test';
    initPerformanceMonitoring();

    expect(callbacks.CLS).toBeDefined();
    // Triggering the callback should not throw and should not attempt to observe marks.
    expect(() => callbacks.CLS?.(buildMetric({ name: 'CLS', value: 0.09 }))).not.toThrow();
  });
});
