import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { structuredLogger } from '../../logger';
import type { Metric } from '../collector';
import {
  dependencies,
  initPerformanceMonitoring,
  markPerformance,
  measurePerformance,
  PERFORMANCE_MARKS,
} from '../collector';

type MetricCallback = Parameters<(typeof dependencies)['onCLS']>[0];

const buildMetric = (overrides: Partial<Metric> = {}): Metric => ({
  name: 'CLS',
  value: 0,
  rating: 'good',
  delta: 0,
  entries: [] as PerformanceEntry[],
  id: 'metric-id',
  navigationType: 'navigate',
  ...overrides,
});

describe('performance collector', () => {
  const originalDependencies = { ...dependencies };
  let observerCallback:
    | ((list: { getEntries: () => Array<Record<string, unknown>> }) => void)
    | undefined;

  beforeEach(() => {
    observerCallback = undefined;
  });

  afterEach(() => {
    dependencies.window = originalDependencies.window;
    dependencies.global = originalDependencies.global;
    dependencies.onCLS = originalDependencies.onCLS;
    dependencies.onFCP = originalDependencies.onFCP;
    dependencies.onFID = originalDependencies.onFID;
    dependencies.onINP = originalDependencies.onINP;
    dependencies.onLCP = originalDependencies.onLCP;
    dependencies.onTTFB = originalDependencies.onTTFB;
    dependencies.getNodeEnv = originalDependencies.getNodeEnv;
    jest.restoreAllMocks();
    observerCallback = undefined;
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

    dependencies.getNodeEnv = () => 'development';
    const loggerDebug = jest.spyOn(structuredLogger, 'debug').mockImplementation(() => undefined);

    initPerformanceMonitoring();

    callbacks.CLS?.(buildMetric({ name: 'CLS', value: 0.2 }));
    callbacks.FCP?.(buildMetric({ name: 'FCP', value: 1900 }));
    callbacks.LCP?.(buildMetric({ name: 'LCP', value: 2000 }));
    callbacks.TTFB?.(buildMetric({ name: 'TTFB', value: 1200 }));
    callbacks.FID?.(buildMetric({ name: 'FID', value: 450 }));
    callbacks.INP?.(buildMetric({ name: 'INP', value: 650 }));

    expect(loggerDebug).toHaveBeenCalledWith('[Performance] CLS', {
      component: 'performance',
      value: 0.2,
      rating: 'needs-improvement',
    });
    expect(plausible).toHaveBeenCalledWith(
      'performance',
      expect.objectContaining({
        props: expect.objectContaining({ metric: 'CLS', rating: 'needs-improvement', value: 0 }),
      })
    );
    expect(plausible).toHaveBeenCalledWith(
      'performance',
      expect.objectContaining({
        props: expect.objectContaining({ metric: 'LCP', rating: 'good', value: 2000 }),
      })
    );
    expect(plausible).toHaveBeenCalledWith(
      'performance',
      expect.objectContaining({
        props: expect.objectContaining({
          metric: 'TTFB',
          rating: 'needs-improvement',
          value: 1200,
        }),
      })
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
      })
    );
  });

  it('marks and measures custom timings when the performance API exists', () => {
    const mark = jest.fn();
    const measure = jest.fn();

    dependencies.window = { performance: { mark, measure } as Record<string, unknown> } as Record<
      string,
      any
    >;
    dependencies.global = dependencies.window;

    markPerformance('MAP_INIT');
    expect(mark).toHaveBeenCalledWith(PERFORMANCE_MARKS.MAP_INIT);

    measurePerformance('results-ready', 'MAP_INIT', 'MAP_MARKERS_LOADED');
    expect(measure).toHaveBeenCalledWith(
      'results-ready',
      PERFORMANCE_MARKS.MAP_INIT,
      PERFORMANCE_MARKS.MAP_MARKERS_LOADED
    );
  });

  it('silently skips marks and measures when the API is unavailable', () => {
    dependencies.window = undefined;
    dependencies.global = undefined;

    expect(() => markPerformance('MAP_INIT')).not.toThrow();
    expect(() => measurePerformance('noop', 'MAP_INIT', 'MAP_MARKERS_LOADED')).not.toThrow();
  });

  it('falls back to global scope implementations when window APIs are missing', () => {
    const callbacks: Record<string, MetricCallback> = {};

    dependencies.onCLS = jest.fn((cb: MetricCallback) => {
      callbacks.CLS = cb;
    });

    const mark = jest.fn();
    const measure = jest.fn();
    const plausible = jest.fn();
    const observe = jest.fn();

    class GlobalObserver {
      public observe = observe;

      constructor(callback: (list: { getEntries: () => Array<Record<string, unknown>> }) => void) {
        observerCallback = callback;
      }
    }

    dependencies.window = undefined;
    dependencies.global = {
      performance: { mark, measure },
      PerformanceObserver: GlobalObserver as unknown,
      plausible,
    } as Record<string, any>;

    dependencies.getNodeEnv = () => 'production';
    initPerformanceMonitoring();

    callbacks.CLS?.(buildMetric({ name: 'CLS', value: 0.04 }));
    expect(plausible).toHaveBeenCalledWith(
      'performance',
      expect.objectContaining({
        props: expect.objectContaining({ metric: 'CLS', value: 0, rating: 'good' }),
      })
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
      PERFORMANCE_MARKS.MAP_MARKERS_LOADED
    );
  });

  it('skips reporting when plausible analytics is unavailable or invalid', () => {
    const callbacks: Record<string, MetricCallback> = {};

    dependencies.onCLS = jest.fn((cb: MetricCallback) => {
      callbacks.CLS = cb;
    });

    dependencies.window = { plausible: 'not-a-function' } as Record<string, any>;
    dependencies.global = {} as Record<string, any>;

    dependencies.getNodeEnv = () => 'production';
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

    dependencies.getNodeEnv = () => 'test';
    initPerformanceMonitoring();

    expect(callbacks.CLS).toBeDefined();
    expect(() => callbacks.CLS?.(buildMetric({ name: 'CLS', value: 0.09 }))).not.toThrow();
  });
});
