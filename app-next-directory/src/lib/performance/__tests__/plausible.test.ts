// Mock the budgets module - must be before imports
jest.mock('../budgets.ts', () => ({
  shouldAlert: jest.fn(),
}));

import { shouldAlert } from '../budgets.ts';
import {
  dependencies,
  PERFORMANCE_EVENTS,
  reportPerformanceEvent,
  usePerformanceTracking,
} from '../plausible-integration.ts';

describe('plausible-integration', () => {
  let mockPlausible: jest.Mock;
  let originalWindow: (Window & typeof globalThis & { plausible?: any }) | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation();

    // Setup window mock
    mockPlausible = jest.fn();
    originalWindow = dependencies.window;
    dependencies.window = {
      plausible: mockPlausible,
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    dependencies.window = originalWindow;
  });

  describe('PERFORMANCE_EVENTS', () => {
    it('should export performance event categories', () => {
      expect(PERFORMANCE_EVENTS.WEB_VITALS).toBe('web_vitals');
      expect(PERFORMANCE_EVENTS.SERVER_TIMING).toBe('server_timing');
      expect(PERFORMANCE_EVENTS.RESOURCE_TIMING).toBe('resource_timing');
      expect(PERFORMANCE_EVENTS.CUSTOM_MARK).toBe('custom_mark');
      expect(PERFORMANCE_EVENTS.ALERT).toBe('performance_alert');
    });

    it('should be immutable', () => {
      expect(() => {
        (PERFORMANCE_EVENTS as any).WEB_VITALS = 'modified';
      }).toThrow();
    });
  });

  describe('reportPerformanceEvent', () => {
    it('should return early if window is undefined', () => {
      dependencies.window = undefined;

      reportPerformanceEvent({
        name: 'CLS',
        value: 0.1,
        category: 'WEB_VITALS',
      });

      expect(mockPlausible).not.toHaveBeenCalled();
    });

    it('should warn if plausible is not initialized', () => {
      dependencies.window = {} as any;

      reportPerformanceEvent({
        name: 'CLS',
        value: 0.1,
        category: 'WEB_VITALS',
      });

      expect(console.warn).toHaveBeenCalledWith(
        '[Performance] Plausible Analytics not initialized'
      );
    });

    it('should send web vitals event to plausible', () => {
      reportPerformanceEvent({
        name: 'CLS',
        value: 0.15,
        category: 'WEB_VITALS',
      });

      expect(mockPlausible).toHaveBeenCalledWith('web_vitals', {
        props: {
          metric: 'CLS',
          value: 0,
        },
      });
    });

    it('should round metric values', () => {
      reportPerformanceEvent({
        name: 'LCP',
        value: 2567.89,
        category: 'WEB_VITALS',
      });

      expect(mockPlausible).toHaveBeenCalledWith('web_vitals', {
        props: {
          metric: 'LCP',
          value: 2568,
        },
      });
    });

    it('should include metadata in event props', () => {
      reportPerformanceEvent({
        name: 'custom-metric',
        value: 100,
        category: 'CUSTOM_MARK',
        metadata: {
          page: '/home',
          user: 'test-user',
        },
      });

      expect(mockPlausible).toHaveBeenCalledWith('custom_mark', {
        props: {
          metric: 'custom-metric',
          value: 100,
          page: '/home',
          user: 'test-user',
        },
      });
    });

    it('should check for alerts on web vitals', () => {
      (shouldAlert as jest.Mock).mockReturnValue(null);

      reportPerformanceEvent({
        name: 'CLS',
        value: 0.15,
        category: 'WEB_VITALS',
      });

      expect(shouldAlert).toHaveBeenCalledWith('CLS', 0.15, 'webVitals');
    });

    it('should check for alerts on resource timing', () => {
      (shouldAlert as jest.Mock).mockReturnValue(null);

      reportPerformanceEvent({
        name: 'js',
        value: 450,
        category: 'RESOURCE_TIMING',
      });

      expect(shouldAlert).toHaveBeenCalledWith('js', 450, 'resources');
    });

    it('should check for alerts on server timing', () => {
      (shouldAlert as jest.Mock).mockReturnValue(null);

      reportPerformanceEvent({
        name: 'listings',
        value: 700,
        category: 'SERVER_TIMING',
      });

      expect(shouldAlert).toHaveBeenCalledWith('listings', 700, 'api');
    });

    it('should check for alerts on custom marks', () => {
      (shouldAlert as jest.Mock).mockReturnValue(null);

      reportPerformanceEvent({
        name: 'mapInitialization',
        value: 1000,
        category: 'CUSTOM_MARK',
      });

      expect(shouldAlert).toHaveBeenCalledWith('mapInitialization', 1000, 'features');
    });

    it('should send alert event when threshold is exceeded', () => {
      const mockAlert = {
        metric: 'CLS',
        value: 0.3,
        threshold: 0.25,
        severity: 'error' as const,
        timestamp: Date.now(),
      };
      (shouldAlert as jest.Mock).mockReturnValue(mockAlert);

      reportPerformanceEvent({
        name: 'CLS',
        value: 0.3,
        category: 'WEB_VITALS',
      });

      expect(mockPlausible).toHaveBeenCalledTimes(2);
      expect(mockPlausible).toHaveBeenNthCalledWith(2, 'performance_alert', {
        props: {
          metric: 'CLS',
          value: 0.3,
          threshold: 0.25,
          severity: 'error',
        },
      });
    });

    it('should handle all event categories', () => {
      const categories: Array<keyof typeof PERFORMANCE_EVENTS> = [
        'WEB_VITALS',
        'SERVER_TIMING',
        'RESOURCE_TIMING',
        'CUSTOM_MARK',
      ];

      categories.forEach(category => {
        mockPlausible.mockClear();

        reportPerformanceEvent({
          name: 'test-metric',
          value: 100,
          category,
        });

        expect(mockPlausible).toHaveBeenCalled();
      });
    });

    it('should handle negative values', () => {
      reportPerformanceEvent({
        name: 'test',
        value: -10,
        category: 'CUSTOM_MARK',
      });

      expect(mockPlausible).toHaveBeenCalledWith('custom_mark', {
        props: {
          metric: 'test',
          value: -10,
        },
      });
    });

    it('should handle zero values', () => {
      reportPerformanceEvent({
        name: 'test',
        value: 0,
        category: 'CUSTOM_MARK',
      });

      expect(mockPlausible).toHaveBeenCalledWith('custom_mark', {
        props: {
          metric: 'test',
          value: 0,
        },
      });
    });

    it('should handle large values', () => {
      reportPerformanceEvent({
        name: 'test',
        value: 999999.99,
        category: 'CUSTOM_MARK',
      });

      expect(mockPlausible).toHaveBeenCalledWith('custom_mark', {
        props: {
          metric: 'test',
          value: 1000000,
        },
      });
    });

    it('should not send alert if shouldAlert returns null', () => {
      (shouldAlert as jest.Mock).mockReturnValue(null);

      reportPerformanceEvent({
        name: 'CLS',
        value: 0.05,
        category: 'WEB_VITALS',
      });

      expect(mockPlausible).toHaveBeenCalledTimes(1);
      expect(mockPlausible).toHaveBeenCalledWith('web_vitals', expect.any(Object));
    });
  });

  describe('usePerformanceTracking', () => {
    it('should return tracking function', () => {
      const { trackPerformance } = usePerformanceTracking();

      expect(trackPerformance).toBeDefined();
      expect(typeof trackPerformance).toBe('function');
    });

    it('should track performance with CUSTOM_MARK category', () => {
      const { trackPerformance } = usePerformanceTracking();

      trackPerformance({
        name: 'user-interaction',
        value: 150,
      });

      expect(mockPlausible).toHaveBeenCalledWith('custom_mark', {
        props: {
          metric: 'user-interaction',
          value: 150,
        },
      });
    });

    it('should track performance with metadata', () => {
      const { trackPerformance } = usePerformanceTracking();

      trackPerformance({
        name: 'button-click',
        value: 50,
        metadata: {
          buttonId: 'submit-btn',
          page: '/form',
        },
      });

      expect(mockPlausible).toHaveBeenCalledWith('custom_mark', {
        props: {
          metric: 'button-click',
          value: 50,
          buttonId: 'submit-btn',
          page: '/form',
        },
      });
    });

    it('should handle multiple tracking calls', () => {
      const { trackPerformance } = usePerformanceTracking();

      trackPerformance({ name: 'event1', value: 100 });
      trackPerformance({ name: 'event2', value: 200 });
      trackPerformance({ name: 'event3', value: 300 });

      expect(mockPlausible).toHaveBeenCalledTimes(3);
    });

    it('should work when plausible is not initialized', () => {
      dependencies.window = {} as any;
      const { trackPerformance } = usePerformanceTracking();

      expect(() => {
        trackPerformance({ name: 'test', value: 100 });
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith(
        '[Performance] Plausible Analytics not initialized'
      );
    });

    it('should check for alerts on tracked performance', () => {
      (shouldAlert as jest.Mock).mockReturnValue(null);
      const { trackPerformance } = usePerformanceTracking();

      trackPerformance({
        name: 'searchResults',
        value: 600,
      });

      expect(shouldAlert).toHaveBeenCalledWith('searchResults', 600, 'features');
    });

    it('should send alert when threshold exceeded', () => {
      const mockAlert = {
        metric: 'searchResults',
        value: 900,
        threshold: 800,
        severity: 'error' as const,
        timestamp: Date.now(),
      };
      (shouldAlert as jest.Mock).mockReturnValue(mockAlert);

      const { trackPerformance } = usePerformanceTracking();
      trackPerformance({
        name: 'searchResults',
        value: 900,
      });

      expect(mockPlausible).toHaveBeenCalledTimes(2);
      expect(mockPlausible).toHaveBeenNthCalledWith(2, 'performance_alert', {
        props: {
          metric: 'searchResults',
          value: 900,
          threshold: 800,
          severity: 'error',
        },
      });
    });
  });
});
