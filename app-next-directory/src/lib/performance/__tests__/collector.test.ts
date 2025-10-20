import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import {
  PERFORMANCE_MARKS,
  PERFORMANCE_THRESHOLDS,
  dependencies,
  initPerformanceMonitoring,
  markPerformance,
  measurePerformance,
} from '../collector';

describe('performance collector', () => {
  let originalDependencies: typeof dependencies;
  let originalEnv: string | undefined;
  let mockPlausible: jest.Mock;
  let mockPerformance: { mark: jest.Mock; measure: jest.Mock };
  let observeMock: jest.Mock;
  let performanceObserverCtor: jest.Mock;
  let observerCallback: ((list: { getEntries: () => Array<Record<string, any>> }) => void) | undefined;
  const callbacks: Record<string, ((metric: any) => void) | undefined> = {};

  beforeEach(() => {
    originalDependencies = { ...dependencies };
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';

    jest.restoreAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockPlausible = jest.fn();
    mockPerformance = {
      mark: jest.fn(),
      measure: jest.fn(),
    };
    observeMock = jest.fn();

    performanceObserverCtor = jest.fn((cb: typeof observerCallback) => {
      observerCallback = cb;
      return {
        observe: observeMock,
        disconnect: jest.fn(),
        takeRecords: jest.fn(),
      };
    });

    callbacks.CLS = undefined;
    callbacks.FCP = undefined;
    callbacks.FID = undefined;
    callbacks.INP = undefined;
    callbacks.LCP = undefined;
    callbacks.TTFB = undefined;

    dependencies.window = {
      plausible: mockPlausible,
      performance: mockPerformance,
      PerformanceObserver: performanceObserverCtor as unknown as typeof PerformanceObserver,
    } as unknown as Window;
    dependencies.global = {
      ...dependencies.global,
      plausible: mockPlausible,
    };

    dependencies.onCLS = jest.fn((cb) => {
      callbacks.CLS = cb;
    });
    dependencies.onFCP = jest.fn((cb) => {
      callbacks.FCP = cb;
    });
    dependencies.onFID = jest.fn((cb) => {
      callbacks.FID = cb;
    });
    dependencies.onINP = jest.fn((cb) => {
      callbacks.INP = cb;
    });
    dependencies.onLCP = jest.fn((cb) => {
      callbacks.LCP = cb;
    });
    dependencies.onTTFB = jest.fn((cb) => {
      callbacks.TTFB = cb;
    });
  });

  afterEach(() => {
    Object.assign(dependencies, originalDependencies);
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
    observerCallback = undefined;
  });

  it('exposes expected performance metadata constants', () => {
    expect(PERFORMANCE_THRESHOLDS.FCP.good).toBe(1800);
    expect(PERFORMANCE_THRESHOLDS.LCP.needsImprovement).toBe(4000);
    expect(PERFORMANCE_MARKS.SEARCH_COMPLETED).toBe('search-completed');
    expect(PERFORMANCE_MARKS.LISTING_LOADED).toBe('listing-loaded');
  });

  it('registers web vitals callbacks and reports ratings with console output in development', () => {
    process.env.NODE_ENV = 'development';

    initPerformanceMonitoring();

    expect(dependencies.onCLS).toHaveBeenCalledTimes(1);
    expect(dependencies.onFCP).toHaveBeenCalledTimes(1);
    expect(dependencies.onFID).toHaveBeenCalledTimes(1);
    expect(dependencies.onINP).toHaveBeenCalledTimes(1);
    expect(dependencies.onLCP).toHaveBeenCalledTimes(1);
    expect(dependencies.onTTFB).toHaveBeenCalledTimes(1);
    expect(performanceObserverCtor).toHaveBeenCalledTimes(1);
    expect(observeMock).toHaveBeenCalledWith({ entryTypes: ['mark', 'measure'] });

    callbacks.FCP?.({ name: 'FCP', value: 2800 });
    callbacks.INP?.({ name: 'INP', value: 123.6 });

    expect(mockPlausible).toHaveBeenCalledWith('performance', {
      props: { metric: 'FCP', value: 2800, rating: 'needs-improvement' },
    });
    expect(mockPlausible).toHaveBeenCalledWith('performance', {
      props: { metric: 'INP', value: 124, rating: 'good' },
    });
    expect(console.log).toHaveBeenCalledWith('[Performance] FCP: 2800 (needs-improvement)');
    expect(console.log).toHaveBeenCalledWith('[Performance] INP: 123.6 (good)');
  });

  it('falls back to global scope when window does not provide a plausible client', () => {
    (dependencies.window as Record<string, any>).plausible = undefined;

    initPerformanceMonitoring();

    callbacks.CLS?.({ name: 'CLS', value: 0.08 });

    expect(mockPlausible).toHaveBeenCalledWith('performance', {
      props: { metric: 'CLS', value: 0, rating: 'good' },
    });
  });

  it('handles missing PerformanceObserver without throwing and without observing entries', () => {
    (dependencies.window as Record<string, any>).PerformanceObserver = undefined;

    expect(() => initPerformanceMonitoring()).not.toThrow();
    expect(observeMock).not.toHaveBeenCalled();
  });

  it('reports entries emitted by the PerformanceObserver', () => {
    initPerformanceMonitoring();
    expect(typeof observerCallback).toBe('function');

    observerCallback?.({
      getEntries: () => [
        { name: 'custom-measure', duration: 56.3 },
        { name: 'custom-mark', startTime: 88 },
      ],
    });

    expect(mockPlausible).toHaveBeenCalledWith('performance', {
      props: { metric: 'custom-measure', value: 56, rating: 'good' },
    });
    expect(mockPlausible).toHaveBeenCalledWith('performance', {
      props: { metric: 'custom-mark', value: 88, rating: 'good' },
    });
  });

  it('creates performance marks when the API is available', () => {
    markPerformance('SEARCH_COMPLETED');

    expect(mockPerformance.mark).toHaveBeenCalledWith('search-completed');
  });

  it('does not attempt to mark performance when the API is unavailable', () => {
    dependencies.window = undefined;
    dependencies.global = undefined;

    markPerformance('MAP_INIT');

    expect(mockPerformance.mark).not.toHaveBeenCalledWith('map-initialization');
  });

  it('measures performance duration when both marks exist', () => {
    measurePerformance('search-latency', 'SEARCH_STARTED', 'SEARCH_COMPLETED');

    expect(mockPerformance.measure).toHaveBeenCalledWith(
      'search-latency',
      'search-started',
      'search-completed'
    );
  });

  it('bails out of measuring when the performance API is missing', () => {
    (dependencies.window as Record<string, any>).performance = {};

    measurePerformance('search-latency', 'SEARCH_STARTED', 'SEARCH_COMPLETED');

    expect(mockPerformance.measure).not.toHaveBeenCalledWith(
      'search-latency',
      'search-started',
      'search-completed'
    );
  });
});
