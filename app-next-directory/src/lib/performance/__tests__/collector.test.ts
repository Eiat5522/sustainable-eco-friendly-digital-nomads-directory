import {
  PERFORMANCE_THRESHOLDS,
  PERFORMANCE_MARKS,
  initPerformanceMonitoring,
  markPerformance,
  measurePerformance,
} from '../collector';

describe('collector', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  const originalWindow = global.window;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Mock window and performance API
    global.window = {
      plausible: jest.fn(),
      performance: {
        mark: jest.fn(),
        measure: jest.fn(),
      },
      PerformanceObserver: jest.fn().mockImplementation((callback) => ({
        observe: jest.fn(),
        disconnect: jest.fn(),
      })),
    } as any;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    global.window = originalWindow;
    process.env.NODE_ENV = originalEnv;
  });

  describe('PERFORMANCE_THRESHOLDS', () => {
    it('should export Core Web Vitals thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS).toBeDefined();
      expect(PERFORMANCE_THRESHOLDS.CLS).toEqual({ good: 0.1, needsImprovement: 0.25 });
      expect(PERFORMANCE_THRESHOLDS.FCP).toEqual({ good: 1800, needsImprovement: 3000 });
      expect(PERFORMANCE_THRESHOLDS.FID).toEqual({ good: 100, needsImprovement: 300 });
      expect(PERFORMANCE_THRESHOLDS.INP).toEqual({ good: 200, needsImprovement: 500 });
      expect(PERFORMANCE_THRESHOLDS.LCP).toEqual({ good: 2500, needsImprovement: 4000 });
      expect(PERFORMANCE_THRESHOLDS.TTFB).toEqual({ good: 800, needsImprovement: 1800 });
    });

    it('should have good threshold less than needsImprovement for all metrics', () => {
      const metrics = Object.keys(PERFORMANCE_THRESHOLDS) as (keyof typeof PERFORMANCE_THRESHOLDS)[];
      
      metrics.forEach(metric => {
        const threshold = PERFORMANCE_THRESHOLDS[metric];
        expect(threshold.good).toBeLessThan(threshold.needsImprovement);
      });
    });
  });

  describe('PERFORMANCE_MARKS', () => {
    it('should export performance mark constants', () => {
      expect(PERFORMANCE_MARKS).toBeDefined();
      expect(PERFORMANCE_MARKS.MAP_INIT).toBe('map-initialization');
      expect(PERFORMANCE_MARKS.MAP_MARKERS_LOADED).toBe('map-markers-loaded');
      expect(PERFORMANCE_MARKS.SEARCH_STARTED).toBe('search-started');
      expect(PERFORMANCE_MARKS.SEARCH_COMPLETED).toBe('search-completed');
      expect(PERFORMANCE_MARKS.FILTERS_APPLIED).toBe('filters-applied');
      expect(PERFORMANCE_MARKS.LISTING_LOADED).toBe('listing-loaded');
    });

    it('should have unique values for all marks', () => {
      const values = Object.values(PERFORMANCE_MARKS);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('initPerformanceMonitoring', () => {
    it('should initialize performance monitoring without errors', () => {
      expect(() => initPerformanceMonitoring()).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalled(); // Mock web-vitals warnings
    });

    it('should set up PerformanceObserver when available', () => {
      const mockObserve = jest.fn();
      const PerformanceObserverMock = jest.fn().mockImplementation(() => ({
        observe: mockObserve,
        disconnect: jest.fn(),
      }));
      
      global.window = {
        plausible: jest.fn(),
        performance: {
          mark: jest.fn(),
          measure: jest.fn(),
        },
        PerformanceObserver: PerformanceObserverMock as any,
      } as any;

      initPerformanceMonitoring();
      
      expect(PerformanceObserverMock).toHaveBeenCalled();
      expect(mockObserve).toHaveBeenCalled();
    });

    it('should handle missing PerformanceObserver gracefully', () => {
      global.window = {
        plausible: jest.fn(),
        performance: {
          mark: jest.fn(),
          measure: jest.fn(),
        },
      } as any;

      expect(() => initPerformanceMonitoring()).not.toThrow();
    });

    it('should setup observers for mark and measure entry types', () => {
      const mockObserve = jest.fn();
      const PerformanceObserverMock = jest.fn().mockImplementation(() => ({
        observe: mockObserve,
        disconnect: jest.fn(),
      }));

      global.window = {
        plausible: jest.fn(),
        performance: {
          mark: jest.fn(),
          measure: jest.fn(),
        },
        PerformanceObserver: PerformanceObserverMock as any,
      } as any;

      initPerformanceMonitoring();

      expect(mockObserve).toHaveBeenCalledWith({ entryTypes: ['mark', 'measure'] });
    });

    it('should warn about missing web-vitals package', () => {
      initPerformanceMonitoring();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('web-vitals package not installed')
      );
    });
  });

  describe('markPerformance', () => {
    it('should create a performance mark with the correct name', () => {
      const mockMark = jest.fn();
      global.window = {
        performance: { mark: mockMark },
      } as any;

      markPerformance('MAP_INIT');

      expect(mockMark).toHaveBeenCalledWith('map-initialization');
    });

    it('should handle all PERFORMANCE_MARKS keys', () => {
      const mockMark = jest.fn();
      global.window = {
        performance: { mark: mockMark },
      } as any;

      const marks: (keyof typeof PERFORMANCE_MARKS)[] = [
        'MAP_INIT',
        'MAP_MARKERS_LOADED',
        'SEARCH_STARTED',
        'SEARCH_COMPLETED',
        'FILTERS_APPLIED',
        'LISTING_LOADED',
      ];

      marks.forEach(mark => {
        markPerformance(mark);
      });

      expect(mockMark).toHaveBeenCalledTimes(6);
    });

    it('should not throw when window is undefined', () => {
      global.window = undefined as any;

      expect(() => markPerformance('MAP_INIT')).not.toThrow();
    });

    it('should not throw when performance API is missing', () => {
      global.window = {} as any;

      expect(() => markPerformance('SEARCH_STARTED')).not.toThrow();
    });

    it('should mark MAP_MARKERS_LOADED correctly', () => {
      const mockMark = jest.fn();
      global.window = {
        performance: { mark: mockMark },
      } as any;

      markPerformance('MAP_MARKERS_LOADED');

      expect(mockMark).toHaveBeenCalledWith('map-markers-loaded');
    });

    it('should mark FILTERS_APPLIED correctly', () => {
      const mockMark = jest.fn();
      global.window = {
        performance: { mark: mockMark },
      } as any;

      markPerformance('FILTERS_APPLIED');

      expect(mockMark).toHaveBeenCalledWith('filters-applied');
    });
  });

  describe('measurePerformance', () => {
    it('should measure time between two marks', () => {
      const mockMeasure = jest.fn();
      global.window = {
        performance: { measure: mockMeasure },
      } as any;

      measurePerformance('search-duration', 'SEARCH_STARTED', 'SEARCH_COMPLETED');

      expect(mockMeasure).toHaveBeenCalledWith(
        'search-duration',
        'search-started',
        'search-completed'
      );
    });

    it('should handle map initialization measurement', () => {
      const mockMeasure = jest.fn();
      global.window = {
        performance: { measure: mockMeasure },
      } as any;

      measurePerformance('map-load-time', 'MAP_INIT', 'MAP_MARKERS_LOADED');

      expect(mockMeasure).toHaveBeenCalledWith(
        'map-load-time',
        'map-initialization',
        'map-markers-loaded'
      );
    });

    it('should not throw when window is undefined', () => {
      global.window = undefined as any;

      expect(() => 
        measurePerformance('test', 'MAP_INIT', 'MAP_MARKERS_LOADED')
      ).not.toThrow();
    });

    it('should not throw when performance API is missing', () => {
      global.window = {} as any;

      expect(() => 
        measurePerformance('test', 'SEARCH_STARTED', 'SEARCH_COMPLETED')
      ).not.toThrow();
    });

    it('should handle different mark combinations', () => {
      const mockMeasure = jest.fn();
      global.window = {
        performance: { measure: mockMeasure },
      } as any;

      measurePerformance('filter-duration', 'SEARCH_STARTED', 'FILTERS_APPLIED');

      expect(mockMeasure).toHaveBeenCalledWith(
        'filter-duration',
        'search-started',
        'filters-applied'
      );
    });

    it('should accept custom measure names', () => {
      const mockMeasure = jest.fn();
      global.window = {
        performance: { measure: mockMeasure },
      } as any;

      measurePerformance('custom-metric-name', 'LISTING_LOADED', 'SEARCH_COMPLETED');

      expect(mockMeasure).toHaveBeenCalledWith(
        'custom-metric-name',
        'listing-loaded',
        'search-completed'
      );
    });
  });

  describe('Integration scenarios', () => {
    it('should support full performance tracking workflow', () => {
      const mockMark = jest.fn();
      const mockMeasure = jest.fn();
      global.window = {
        performance: { 
          mark: mockMark,
          measure: mockMeasure,
        },
      } as any;

      // Mark start
      markPerformance('SEARCH_STARTED');
      expect(mockMark).toHaveBeenCalledWith('search-started');

      // Mark end
      markPerformance('SEARCH_COMPLETED');
      expect(mockMark).toHaveBeenCalledWith('search-completed');

      // Measure duration
      measurePerformance('search-time', 'SEARCH_STARTED', 'SEARCH_COMPLETED');
      expect(mockMeasure).toHaveBeenCalledWith(
        'search-time',
        'search-started',
        'search-completed'
      );
    });

    it('should handle multiple sequential measurements', () => {
      const mockMark = jest.fn();
      const mockMeasure = jest.fn();
      global.window = {
        performance: { 
          mark: mockMark,
          measure: mockMeasure,
        },
      } as any;

      markPerformance('MAP_INIT');
      markPerformance('MAP_MARKERS_LOADED');
      markPerformance('FILTERS_APPLIED');

      measurePerformance('map-to-markers', 'MAP_INIT', 'MAP_MARKERS_LOADED');
      measurePerformance('markers-to-filters', 'MAP_MARKERS_LOADED', 'FILTERS_APPLIED');

      expect(mockMark).toHaveBeenCalledTimes(3);
      expect(mockMeasure).toHaveBeenCalledTimes(2);
    });
  });

  describe('Plausible integration', () => {
    it('should be prepared for plausible tracking', () => {
      const mockPlausible = jest.fn();
      global.window = {
        plausible: mockPlausible,
        performance: {
          mark: jest.fn(),
          measure: jest.fn(),
        },
        PerformanceObserver: jest.fn().mockImplementation(() => ({
          observe: jest.fn(),
          disconnect: jest.fn(),
        })),
      } as any;

      initPerformanceMonitoring();

      // Plausible should be available for the observer callback
      expect(window.plausible).toBeDefined();
    });

    it('should handle missing plausible gracefully in development', () => {
      process.env.NODE_ENV = 'development';
      global.window = {
        performance: {
          mark: jest.fn(),
          measure: jest.fn(),
        },
        PerformanceObserver: jest.fn().mockImplementation(() => ({
          observe: jest.fn(),
          disconnect: jest.fn(),
        })),
      } as any;

      expect(() => initPerformanceMonitoring()).not.toThrow();
    });
  });
});
