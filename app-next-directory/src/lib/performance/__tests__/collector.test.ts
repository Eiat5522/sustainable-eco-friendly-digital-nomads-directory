import {
  PERFORMANCE_THRESHOLDS,
  PERFORMANCE_MARKS,
  initPerformanceMonitoring,
  markPerformance,
  measurePerformance,
  dependencies,
} from '../collector';

// Mock the plausible-integration module
jest.mock('../plausible-integration', () => ({
  reportPerformanceEvent: jest.fn(),
}));

import { reportPerformanceEvent } from '../plausible-integration';

describe('collector', () => {
  let mockPlausible: jest.Mock;
  let mockMark: jest.Mock;
  let mockMeasure: jest.Mock;
  let mockPerformanceObserver: jest.Mock;
  let observeMock: jest.Mock;
  let originalDependencies: typeof dependencies;

  // Mock web-vitals callbacks
  let onCLSCallback: (metric: any) => void;
  let onFCPCallback: (metric: any) => void;
  let onFIDCallback: (metric: any) => void;
  let onINPCallback: (metric: any) => void;
  let onLCPCallback: (metric: any) => void;
  let onTTFBCallback: (metric: any) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();

    mockPlausible = jest.fn();
    mockMark = jest.fn();
    mockMeasure = jest.fn();
    
    observeMock = jest.fn();
    const disconnectMock = jest.fn();
    mockPerformanceObserver = jest.fn(() => ({
        observe: observeMock,
        disconnect: disconnectMock,
        takeRecords: jest.fn(),
    }));

    // Backup original dependencies and setup mocks
    originalDependencies = { ...dependencies };
    dependencies.window = {
      plausible: mockPlausible,
      performance: {
        mark: mockMark,
        measure: mockMeasure,
      },
      PerformanceObserver: mockPerformanceObserver,
    } as any;

    dependencies.onCLS = jest.fn(cb => (onCLSCallback = cb));
    dependencies.onFCP = jest.fn(cb => (onFCPCallback = cb));
    dependencies.onFID = jest.fn(cb => (onFIDCallback = cb));
    dependencies.onINP = jest.fn(cb => (onINPCallback = cb));
    dependencies.onLCP = jest.fn(cb => (onLCPCallback = cb));
    dependencies.onTTFB = jest.fn(cb => (onTTFBCallback = cb));
  });

  afterEach(() => {
    // Restore original dependencies
    Object.assign(dependencies, originalDependencies);
    jest.restoreAllMocks();
  });

  describe('PERFORMANCE_THRESHOLDS', () => {
    it('should export correct thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.FCP.good).toBe(1800);
      expect(PERFORMANCE_THRESHOLDS.LCP.needsImprovement).toBe(4000);
    });
  });

  describe('PERFORMANCE_MARKS', () => {
    it('should export correct mark names', () => {
      expect(PERFORMANCE_MARKS.SEARCH_STARTED).toBe('search-started');
      expect(PERFORMANCE_MARKS.LISTING_LOADED).toBe('listing-loaded');
    });
  });

  describe('initPerformanceMonitoring', () => {
    it('should set up web-vitals monitoring', () => {
      initPerformanceMonitoring();

      expect(dependencies.onCLS).toHaveBeenCalled();
      expect(dependencies.onFCP).toHaveBeenCalled();
      expect(dependencies.onFID).toHaveBeenCalled();
      expect(dependencies.onINP).toHaveBeenCalled();
      expect(dependencies.onLCP).toHaveBeenCalled();
      expect(dependencies.onTTFB).toHaveBeenCalled();
    });

    it('should report web-vitals metrics correctly', () => {
      initPerformanceMonitoring();

      onLCPCallback({ name: 'LCP', value: 2000, rating: 'good' });
      expect(mockPlausible).toHaveBeenCalledWith('performance', {
        props: {
          metric: 'LCP',
          value: 2000,
          rating: 'good',
        },
      });

      onFCPCallback({ name: 'FCP', value: 4000, rating: 'poor' });
      expect(mockPlausible).toHaveBeenCalledWith('performance', {
        props: {
            metric: 'FCP',
            value: 4000,
            rating: 'poor',
        },
      });
    });

    it('should set up observer to handle performance entries', () => {
      initPerformanceMonitoring();

      expect(mockPerformanceObserver).toHaveBeenCalledWith(expect.any(Function));
      expect(observeMock).toHaveBeenCalledWith({ entryTypes: ['mark', 'measure'] });

      const handler = mockPerformanceObserver.mock.calls[0][0];
      handler({
          getEntries: () => [{ name: 'test-mark', duration: 123, entryType: 'mark' }],
      });

      expect(mockPlausible).toHaveBeenCalledWith('performance', {
        props: { metric: 'test-mark', value: 123, rating: 'good' },
      });
    });

    it('should handle performance entries with duration', () => {
      initPerformanceMonitoring();
      const handler = mockPerformanceObserver.mock.calls[0][0];

      handler({
        getEntries: () => [{ name: 'test-measure', duration: 500, entryType: 'measure' }],
      });

      expect(mockPlausible).toHaveBeenCalledWith('performance', {
        props: { metric: 'test-measure', value: 500, rating: 'good' },
      });
    });

    it('should handle performance entries without duration (marks)', () => {
      initPerformanceMonitoring();
      const handler = mockPerformanceObserver.mock.calls[0][0];

      handler({
        getEntries: () => [
          { name: 'start_event', startTime: 100, entryType: 'mark' },
        ],
      });

      expect(mockPlausible).toHaveBeenCalledWith('performance', {
        props: { metric: 'start_event', value: 100, rating: 'good' },
      });
    });

    it('should send metrics to Plausible when available', () => {
      initPerformanceMonitoring();

      onTTFBCallback({ name: 'custom-metric', value: 200, rating: 'poor' });

      expect(mockPlausible).toHaveBeenCalledWith('performance', {
        props: {
          metric: 'TTFB',
          value: 200,
          rating: 'good',
        },
      });
    });

    it('should handle multiple performance entries', () => {
      initPerformanceMonitoring();
      const handler = mockPerformanceObserver.mock.calls[0][0];

      handler({
        getEntries: () => [
          { name: 'mark1', startTime: 50 },
          { name: 'mark2', duration: 150 },
          { name: 'mark3', startTime: 250 },
        ],
      });

      expect(mockPlausible).toHaveBeenCalledTimes(3);
    });
  });

  describe('markPerformance', () => {
    it('should not throw if window is not available', () => {
      dependencies.window = undefined;
      expect(() => markPerformance('SEARCH_STARTED')).not.toThrow();
    });

    it('should not throw if performance API is not available', () => {
      dependencies.window = {} as any;
      expect(() => markPerformance('SEARCH_STARTED')).not.toThrow();
    });

    it('should call performance.mark with the correct name', () => {
      markPerformance('MAP_INIT');
      expect(mockMark).toHaveBeenCalledWith('map-initialization');
    });

    it('should work in browser environment', () => {
        markPerformance('SEARCH_STARTED');

        expect(mockMark).toHaveBeenCalledWith('search-started');
      });
  });

  describe('measurePerformance', () => {
    it('should not throw if window or performance API not available', () => {
      dependencies.window = undefined;
      expect(() =>
        measurePerformance('search-time', 'SEARCH_STARTED', 'SEARCH_COMPLETED')
      ).not.toThrow();

      dependencies.window = {} as any;
      expect(() =>
        measurePerformance('search-time', 'SEARCH_STARTED', 'SEARCH_COMPLETED')
      ).not.toThrow();
    });

    it('should call performance.measure with correct arguments', () => {
      measurePerformance('map-load-time', 'MAP_INIT', 'MAP_MARKERS_LOADED');

      expect(mockMeasure).toHaveBeenCalledWith(
        'map-load-time',
        'map-initialization',
        'map-markers-loaded'
      );
    });
  });
});