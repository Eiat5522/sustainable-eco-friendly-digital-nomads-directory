import {
  PERFORMANCE_THRESHOLDS,
  PERFORMANCE_MARKS,
  initPerformanceMonitoring,
  markPerformance,
  measurePerformance,
} from '../collector';

describe('collector', () => {
  let mockPlausible: jest.Mock;
  let mockPerformanceObserver: jest.Mock;
  let mockObserve: jest.Mock;
  let mockDisconnect: jest.Mock;
  let performanceCallbacks: Map<string, Function>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    
    performanceCallbacks = new Map();

    // Mock plausible
    mockPlausible = jest.fn();
    
    // Mock global performance API
    const mockPerformanceAPI = {
      mark: jest.fn(),
      measure: jest.fn(),
    };
    
    (global as any).window = {
      plausible: mockPlausible,
      performance: mockPerformanceAPI,
    };
    (global as any).performance = mockPerformanceAPI;

    // Mock PerformanceObserver
    mockObserve = jest.fn();
    mockDisconnect = jest.fn();
    mockPerformanceObserver = jest.fn((callback) => {
      performanceCallbacks.set('observer', callback);
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
      };
    });
    (global as any).PerformanceObserver = mockPerformanceObserver;
    (global as any).window.PerformanceObserver = mockPerformanceObserver;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (global as any).window;
    delete (global as any).performance;
    delete (global as any).PerformanceObserver;
  });

  describe('PERFORMANCE_THRESHOLDS', () => {
    it('should export performance thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS).toBeDefined();
      expect(typeof PERFORMANCE_THRESHOLDS).toBe('object');
    });

    it('should have CLS thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.CLS).toEqual({
        good: 0.1,
        needsImprovement: 0.25,
      });
    });

    it('should have FCP thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.FCP).toEqual({
        good: 1800,
        needsImprovement: 3000,
      });
    });

    it('should have FID thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.FID).toEqual({
        good: 100,
        needsImprovement: 300,
      });
    });

    it('should have INP thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.INP).toEqual({
        good: 200,
        needsImprovement: 500,
      });
    });

    it('should have LCP thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.LCP).toEqual({
        good: 2500,
        needsImprovement: 4000,
      });
    });

    it('should have TTFB thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS.TTFB).toEqual({
        good: 800,
        needsImprovement: 1800,
      });
    });
  });

  describe('PERFORMANCE_MARKS', () => {
    it('should export performance marks', () => {
      expect(PERFORMANCE_MARKS).toBeDefined();
      expect(typeof PERFORMANCE_MARKS).toBe('object');
    });

    it('should have map initialization mark', () => {
      expect(PERFORMANCE_MARKS.MAP_INIT).toBe('map-initialization');
    });

    it('should have map markers loaded mark', () => {
      expect(PERFORMANCE_MARKS.MAP_MARKERS_LOADED).toBe('map-markers-loaded');
    });

    it('should have search started mark', () => {
      expect(PERFORMANCE_MARKS.SEARCH_STARTED).toBe('search-started');
    });

    it('should have search completed mark', () => {
      expect(PERFORMANCE_MARKS.SEARCH_COMPLETED).toBe('search-completed');
    });

    it('should have filters applied mark', () => {
      expect(PERFORMANCE_MARKS.FILTERS_APPLIED).toBe('filters-applied');
    });

    it('should have listing loaded mark', () => {
      expect(PERFORMANCE_MARKS.LISTING_LOADED).toBe('listing-loaded');
    });
  });

  describe('initPerformanceMonitoring', () => {
    it('should initialize without errors', () => {
      expect(() => initPerformanceMonitoring()).not.toThrow();
    });

    it('should warn about mocked web-vitals functions', () => {
      initPerformanceMonitoring();

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('web-vitals package not installed')
      );
    });

    it('should initialize PerformanceObserver when available', () => {
      initPerformanceMonitoring();

      expect(mockPerformanceObserver).toHaveBeenCalled();
      expect(mockObserve).toHaveBeenCalledWith({
        entryTypes: ['mark', 'measure'],
      });
    });

    it('should handle missing PerformanceObserver gracefully', () => {
      delete (global as any).window.PerformanceObserver;
      delete (global as any).PerformanceObserver;

      expect(() => initPerformanceMonitoring()).not.toThrow();
    });

    it('should set up observer to handle performance entries', () => {
      process.env.NODE_ENV = 'development';
      initPerformanceMonitoring();

      const observerCallback = performanceCallbacks.get('observer');
      expect(observerCallback).toBeDefined();

      // Simulate performance entries
      const mockEntries = [
        {
          name: 'test-mark',
          duration: 0,
          startTime: 100,
          entryType: 'mark',
        },
      ];

      observerCallback?.({
        getEntries: () => mockEntries,
      });

      // Should log and report the metric (development mode logs)
      expect(mockPlausible).toHaveBeenCalled();
    });

    it('should handle performance entries with duration', () => {
      process.env.NODE_ENV = 'development';
      initPerformanceMonitoring();

      const observerCallback = performanceCallbacks.get('observer');
      const mockEntries = [
        {
          name: 'test-measure',
          duration: 250,
          startTime: 100,
          entryType: 'measure',
        },
      ];

      observerCallback?.({
        getEntries: () => mockEntries,
      });

      expect(console.log).toHaveBeenCalledWith(
        '[Performance] test-measure: 250 (good)'
      );
    });

    it('should handle performance entries with startTime when duration is 0', () => {
      process.env.NODE_ENV = 'development';
      initPerformanceMonitoring();

      const observerCallback = performanceCallbacks.get('observer');
      const mockEntries = [
        {
          name: 'test-mark',
          duration: 0,
          startTime: 150,
          entryType: 'mark',
        },
      ];

      observerCallback?.({
        getEntries: () => mockEntries,
      });

      expect(console.log).toHaveBeenCalledWith(
        '[Performance] test-mark: 150 (good)'
      );
    });

    it('should send metrics to Plausible when available', () => {
      process.env.NODE_ENV = 'production';
      initPerformanceMonitoring();

      const observerCallback = performanceCallbacks.get('observer');
      const mockEntries = [
        {
          name: 'custom-metric',
          duration: 200,
          startTime: 100,
          entryType: 'measure',
        },
      ];

      observerCallback?.({
        getEntries: () => mockEntries,
      });

      expect(mockPlausible).toHaveBeenCalledWith('performance', {
        props: {
          metric: 'custom-metric',
          value: 200,
          rating: 'good',
        },
      });
    });

    it('should handle multiple performance entries', () => {
      initPerformanceMonitoring();

      const observerCallback = performanceCallbacks.get('observer');
      const mockEntries = [
        { name: 'mark1', duration: 0, startTime: 100, entryType: 'mark' },
        { name: 'mark2', duration: 150, startTime: 200, entryType: 'measure' },
        { name: 'mark3', duration: 0, startTime: 300, entryType: 'mark' },
      ];

      observerCallback?.({
        getEntries: () => mockEntries,
      });

      expect(mockPlausible).toHaveBeenCalledTimes(3);
    });
  });

  describe('markPerformance', () => {
    it('should create performance mark', () => {
      markPerformance('MAP_INIT');

      expect((global as any).performance.mark).toHaveBeenCalledWith(
        'map-initialization'
      );
    });

    it('should handle all performance mark types', () => {
      const markTypes: Array<keyof typeof PERFORMANCE_MARKS> = [
        'MAP_INIT',
        'MAP_MARKERS_LOADED',
        'SEARCH_STARTED',
        'SEARCH_COMPLETED',
        'FILTERS_APPLIED',
        'LISTING_LOADED',
      ];

      markTypes.forEach((markType) => {
        ((global as any).performance.mark as jest.Mock).mockClear();
        markPerformance(markType);
        expect((global as any).performance.mark).toHaveBeenCalled();
      });
    });

    it('should not throw if window is undefined', () => {
      delete (global as any).window;
      delete (global as any).performance;

      expect(() => markPerformance('MAP_INIT')).not.toThrow();
    });

    it('should not throw if performance API is not available', () => {
      (global as any).window = {};
      delete (global as any).performance;

      expect(() => markPerformance('MAP_INIT')).not.toThrow();
    });

    it('should work in browser environment', () => {
      const mockMark = jest.fn();
      (global as any).window = {
        performance: {
          mark: mockMark,
        },
      };

      markPerformance('SEARCH_STARTED');

      expect(mockMark).toHaveBeenCalledWith('search-started');
    });
  });

  describe('measurePerformance', () => {
    it('should measure time between two marks', () => {
      measurePerformance('search-duration', 'SEARCH_STARTED', 'SEARCH_COMPLETED');

      expect((global as any).performance.measure).toHaveBeenCalledWith(
        'search-duration',
        'search-started',
        'search-completed'
      );
    });

    it('should handle map initialization measurement', () => {
      measurePerformance('map-load-time', 'MAP_INIT', 'MAP_MARKERS_LOADED');

      expect((global as any).performance.measure).toHaveBeenCalledWith(
        'map-load-time',
        'map-initialization',
        'map-markers-loaded'
      );
    });

    it('should not throw if window is undefined', () => {
      delete (global as any).window;
      delete (global as any).performance;

      expect(() =>
        measurePerformance('test', 'MAP_INIT', 'MAP_MARKERS_LOADED')
      ).not.toThrow();
    });

    it('should not throw if performance API is not available', () => {
      (global as any).window = {};
      delete (global as any).performance;

      expect(() =>
        measurePerformance('test', 'MAP_INIT', 'MAP_MARKERS_LOADED')
      ).not.toThrow();
    });

    it('should handle custom measure names', () => {
      const customName = 'my-custom-measurement';
      measurePerformance(customName, 'SEARCH_STARTED', 'SEARCH_COMPLETED');

      expect((global as any).performance.measure).toHaveBeenCalledWith(
        customName,
        'search-started',
        'search-completed'
      );
    });

    it('should work with different mark combinations', () => {
      const combinations = [
        { name: 'filter-time', start: 'FILTERS_APPLIED', end: 'SEARCH_COMPLETED' },
        { name: 'listing-time', start: 'SEARCH_COMPLETED', end: 'LISTING_LOADED' },
        { name: 'map-to-search', start: 'MAP_INIT', end: 'SEARCH_STARTED' },
      ];

      combinations.forEach(({ name, start, end }) => {
        ((global as any).performance.measure as jest.Mock).mockClear();
        measurePerformance(
          name,
          start as keyof typeof PERFORMANCE_MARKS,
          end as keyof typeof PERFORMANCE_MARKS
        );
        expect((global as any).performance.measure).toHaveBeenCalled();
      });
    });
  });

  describe('Integration', () => {
    it('should work together: mark and measure', () => {
      markPerformance('SEARCH_STARTED');
      markPerformance('SEARCH_COMPLETED');
      measurePerformance('search-time', 'SEARCH_STARTED', 'SEARCH_COMPLETED');

      expect((global as any).performance.mark).toHaveBeenCalledTimes(2);
      expect((global as any).performance.measure).toHaveBeenCalledTimes(1);
    });

    it('should initialize monitoring and handle marks', () => {
      initPerformanceMonitoring();
      markPerformance('MAP_INIT');

      expect(mockPerformanceObserver).toHaveBeenCalled();
      expect((global as any).performance.mark).toHaveBeenCalled();
    });
  });

  describe('Rating calculation', () => {
    it('should rate metrics correctly based on thresholds', () => {
      process.env.NODE_ENV = 'development';
      initPerformanceMonitoring();

      const observerCallback = performanceCallbacks.get('observer');

      // Test good rating
      observerCallback?.({
        getEntries: () => [
          { name: 'test', duration: 50, startTime: 0, entryType: 'measure' },
        ],
      });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('(good)')
      );
    });

    it('should handle metrics without predefined thresholds', () => {
      process.env.NODE_ENV = 'development';
      initPerformanceMonitoring();

      const observerCallback = performanceCallbacks.get('observer');

      observerCallback?.({
        getEntries: () => [
          { name: 'custom-mark', duration: 0, startTime: 100, entryType: 'mark' },
        ],
      });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('(good)')
      );
    });
  });
});
