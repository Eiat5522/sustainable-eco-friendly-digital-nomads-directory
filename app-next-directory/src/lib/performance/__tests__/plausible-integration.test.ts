import {
  PERFORMANCE_EVENTS,
  reportPerformanceEvent,
  usePerformanceTracking,
} from '../plausible-integration';

// Mock the budgets module
jest.mock('../budgets', () => ({
  shouldAlert: jest.fn(),
}));

import { shouldAlert } from '../budgets';

describe('plausible-integration', () => {
  let consoleWarnSpy: jest.SpyInstance;
  const originalWindow = global.window;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Mock window with plausible
    global.window = {
      plausible: jest.fn(),
    } as any;

    (shouldAlert as jest.Mock).mockClear();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    global.window = originalWindow;
  });

  describe('PERFORMANCE_EVENTS', () => {
    it('should export performance event categories', () => {
      expect(PERFORMANCE_EVENTS.WEB_VITALS).toBe('web_vitals');
      expect(PERFORMANCE_EVENTS.SERVER_TIMING).toBe('server_timing');
      expect(PERFORMANCE_EVENTS.RESOURCE_TIMING).toBe('resource_timing');
      expect(PERFORMANCE_EVENTS.CUSTOM_MARK).toBe('custom_mark');
      expect(PERFORMANCE_EVENTS.ALERT).toBe('performance_alert');
    });

    it('should have unique values for all event types', () => {
      const values = Object.values(PERFORMANCE_EVENTS);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('reportPerformanceEvent', () => {
    it('should report web vitals event to Plausible', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      reportPerformanceEvent({
        name: 'LCP',
        value: 2500,
        category: 'WEB_VITALS',
      });

      expect(mockPlausible).toHaveBeenCalledWith('web_vitals', {
        props: {
          metric: 'LCP',
          value: 2500,
        },
      });
    });

    it('should report server timing event', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      reportPerformanceEvent({
        name: 'api-response',
        value: 450,
        category: 'SERVER_TIMING',
      });

      expect(mockPlausible).toHaveBeenCalledWith('server_timing', {
        props: {
          metric: 'api-response',
          value: 450,
        },
      });
    });

    it('should report resource timing event', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      reportPerformanceEvent({
        name: 'js-bundle',
        value: 350,
        category: 'RESOURCE_TIMING',
      });

      expect(mockPlausible).toHaveBeenCalledWith('resource_timing', {
        props: {
          metric: 'js-bundle',
          value: 350,
        },
      });
    });

    it('should report custom mark event', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      reportPerformanceEvent({
        name: 'map-initialization',
        value: 800,
        category: 'CUSTOM_MARK',
      });

      expect(mockPlausible).toHaveBeenCalledWith('custom_mark', {
        props: {
          metric: 'map-initialization',
          value: 800,
        },
      });
    });

    it('should include metadata in event props', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      reportPerformanceEvent({
        name: 'FCP',
        value: 1500,
        category: 'WEB_VITALS',
        metadata: {
          page: '/listings',
          device: 'mobile',
        },
      });

      expect(mockPlausible).toHaveBeenCalledWith('web_vitals', {
        props: {
          metric: 'FCP',
          value: 1500,
          page: '/listings',
          device: 'mobile',
        },
      });
    });

    it('should round metric values', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      reportPerformanceEvent({
        name: 'LCP',
        value: 2543.789,
        category: 'WEB_VITALS',
      });

      expect(mockPlausible).toHaveBeenCalledWith('web_vitals', {
        props: {
          metric: 'LCP',
          value: 2544, // Rounded
        },
      });
    });

    it('should handle missing plausible gracefully', () => {
      global.window = {} as any;

      expect(() => 
        reportPerformanceEvent({
          name: 'FCP',
          value: 1800,
          category: 'WEB_VITALS',
        })
      ).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Performance] Plausible Analytics not initialized'
      );
    });

    it('should handle undefined window', () => {
      global.window = undefined as any;

      expect(() => 
        reportPerformanceEvent({
          name: 'LCP',
          value: 2500,
          category: 'WEB_VITALS',
        })
      ).not.toThrow();
    });

    it('should check for web vitals alerts', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      reportPerformanceEvent({
        name: 'LCP',
        value: 5000,
        category: 'WEB_VITALS',
      });

      expect(shouldAlert).toHaveBeenCalledWith('LCP', 5000, 'webVitals');
    });

    it('should check for resource timing alerts', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      reportPerformanceEvent({
        name: 'js',
        value: 600,
        category: 'RESOURCE_TIMING',
      });

      expect(shouldAlert).toHaveBeenCalledWith('js', 600, 'resources');
    });

    it('should check for server timing alerts', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      reportPerformanceEvent({
        name: 'listings',
        value: 700,
        category: 'SERVER_TIMING',
      });

      expect(shouldAlert).toHaveBeenCalledWith('listings', 700, 'api');
    });

    it('should check for custom mark alerts', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      reportPerformanceEvent({
        name: 'mapInitialization',
        value: 1500,
        category: 'CUSTOM_MARK',
      });

      expect(shouldAlert).toHaveBeenCalledWith('mapInitialization', 1500, 'features');
    });

    it('should send alert event when alert is triggered', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      const mockAlert = {
        metric: 'LCP',
        value: 5000,
        threshold: 4000,
        severity: 'error' as const,
        timestamp: Date.now(),
      };

      (shouldAlert as jest.Mock).mockReturnValueOnce(mockAlert);

      reportPerformanceEvent({
        name: 'LCP',
        value: 5000,
        category: 'WEB_VITALS',
      });

      // Should call plausible twice: once for the metric, once for the alert
      expect(mockPlausible).toHaveBeenCalledTimes(2);
      expect(mockPlausible).toHaveBeenCalledWith('performance_alert', {
        props: {
          metric: 'LCP',
          value: 5000,
          threshold: 4000,
          severity: 'error',
        },
      });
    });

    it('should not send alert event when no alert is triggered', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      (shouldAlert as jest.Mock).mockReturnValueOnce(null);

      reportPerformanceEvent({
        name: 'LCP',
        value: 2000,
        category: 'WEB_VITALS',
      });

      // Should only call plausible once for the metric
      expect(mockPlausible).toHaveBeenCalledTimes(1);
      expect(mockPlausible).toHaveBeenCalledWith('web_vitals', expect.any(Object));
    });

    it('should handle zero values', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      reportPerformanceEvent({
        name: 'CLS',
        value: 0,
        category: 'WEB_VITALS',
      });

      expect(mockPlausible).toHaveBeenCalledWith('web_vitals', {
        props: {
          metric: 'CLS',
          value: 0,
        },
      });
    });

    it('should handle very large values', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      reportPerformanceEvent({
        name: 'LCP',
        value: 99999,
        category: 'WEB_VITALS',
      });

      expect(mockPlausible).toHaveBeenCalledWith('web_vitals', {
        props: {
          metric: 'LCP',
          value: 99999,
        },
      });
    });

    it('should handle decimal values correctly', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      reportPerformanceEvent({
        name: 'CLS',
        value: 0.123456,
        category: 'WEB_VITALS',
      });

      expect(mockPlausible).toHaveBeenCalledWith('web_vitals', {
        props: {
          metric: 'CLS',
          value: 0, // Rounded to 0
        },
      });
    });
  });

  describe('usePerformanceTracking', () => {
    it('should return an object with trackPerformance function', () => {
      const hook = usePerformanceTracking();
      
      expect(hook).toHaveProperty('trackPerformance');
      expect(typeof hook.trackPerformance).toBe('function');
    });

    it('should call reportPerformanceEvent with CUSTOM_MARK category', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      const { trackPerformance } = usePerformanceTracking();

      trackPerformance({
        name: 'button-click',
        value: 100,
      });

      expect(mockPlausible).toHaveBeenCalledWith('custom_mark', {
        props: {
          metric: 'button-click',
          value: 100,
        },
      });
    });

    it('should support metadata in trackPerformance', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      const { trackPerformance } = usePerformanceTracking();

      trackPerformance({
        name: 'form-submission',
        value: 250,
        metadata: {
          formType: 'contact',
          fields: 5,
        },
      });

      expect(mockPlausible).toHaveBeenCalledWith('custom_mark', {
        props: {
          metric: 'form-submission',
          value: 250,
          formType: 'contact',
          fields: 5,
        },
      });
    });

    it('should handle multiple trackPerformance calls', () => {
      const mockPlausible = jest.fn();
      global.window = { plausible: mockPlausible } as any;

      const { trackPerformance } = usePerformanceTracking();

      trackPerformance({ name: 'event1', value: 100 });
      trackPerformance({ name: 'event2', value: 200 });
      trackPerformance({ name: 'event3', value: 300 });

      expect(mockPlausible).toHaveBeenCalledTimes(3);
    });

    it('should work with missing plausible', () => {
      global.window = {} as any;

      const { trackPerformance } = usePerformanceTracking();

      expect(() => trackPerformance({ name: 'test', value: 100 })).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });
});
