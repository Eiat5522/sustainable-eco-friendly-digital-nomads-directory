import { WebVitalsReporter, type WebVitalsMetric } from '../web-vitals-reporter.ts';

describe('web-vitals-reporter', () => {
  let consoleLogSpy: jest.SpyInstance;
  let sendBeaconSpy: jest.SpyInstance;
  let fetchSpy: jest.SpyInstance;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Mock navigator.sendBeacon
    sendBeaconSpy = jest.fn().mockReturnValue(true);
    Object.defineProperty(global.navigator, 'sendBeacon', {
      writable: true,
      configurable: true,
      value: sendBeaconSpy,
    });

    // Mock fetch
    fetchSpy = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    global.fetch = fetchSpy;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  describe('WebVitalsReporter', () => {
    const createMockMetric = (name: string, value: number): WebVitalsMetric => ({
      id: `v1-${Date.now()}-${Math.random()}`,
      name,
      value,
      delta: value,
      entries: [] as PerformanceEntry[],
    });

    it('should log metrics in development mode', () => {
      process.env.NODE_ENV = 'development';
      const metric = createMockMetric('LCP', 2500);

      WebVitalsReporter(metric);

      expect(consoleLogSpy).toHaveBeenCalledWith('Web Vitals:', {
        name: 'LCP',
        value: 2500,
        delta: 2500,
      });
    });

    it('should not log metrics in production mode', () => {
      process.env.NODE_ENV = 'production';
      const metric = createMockMetric('FCP', 1800);

      WebVitalsReporter(metric);

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should use sendBeacon when available', () => {
      const metric = createMockMetric('CLS', 0.05);

      WebVitalsReporter(metric);

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        '/api/performance/web-vitals',
        JSON.stringify(metric)
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should fallback to fetch when sendBeacon is not available', () => {
      // Remove sendBeacon
      Object.defineProperty(global.navigator, 'sendBeacon', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const metric = createMockMetric('FID', 100);

      WebVitalsReporter(metric);

      expect(fetchSpy).toHaveBeenCalledWith('/api/performance/web-vitals', {
        body: JSON.stringify(metric),
        method: 'POST',
        keepalive: true,
      });
    });

    it('should handle TTFB metric', () => {
      const metric = createMockMetric('TTFB', 800);

      WebVitalsReporter(metric);

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        '/api/performance/web-vitals',
        expect.stringContaining('"name":"TTFB"')
      );
    });

    it('should handle INP metric', () => {
      const metric = createMockMetric('INP', 200);

      WebVitalsReporter(metric);

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        '/api/performance/web-vitals',
        expect.stringContaining('"name":"INP"')
      );
    });

    it('should preserve metric id', () => {
      const metric = createMockMetric('LCP', 3000);
      const metricId = metric.id;

      WebVitalsReporter(metric);

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        '/api/performance/web-vitals',
        expect.stringContaining(`"id":"${metricId}"`)
      );
    });

    it('should include all metric properties in the payload', () => {
      const metric: WebVitalsMetric = {
        id: 'test-id-123',
        name: 'LCP',
        value: 2500,
        delta: 500,
        entries: [] as PerformanceEntry[],
      };

      WebVitalsReporter(metric);

      const payload = JSON.parse(sendBeaconSpy.mock.calls[0][1]);
      expect(payload).toEqual({
        id: 'test-id-123',
        name: 'LCP',
        value: 2500,
        delta: 500,
        entries: [],
      });
    });

    it('should handle zero values', () => {
      const metric = createMockMetric('CLS', 0);

      WebVitalsReporter(metric);

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        '/api/performance/web-vitals',
        expect.stringContaining('"value":0')
      );
    });

    it('should handle large values', () => {
      const metric = createMockMetric('LCP', 10000);

      WebVitalsReporter(metric);

      expect(sendBeaconSpy).toHaveBeenCalledWith(
        '/api/performance/web-vitals',
        expect.stringContaining('"value":10000')
      );
    });

    it('should handle metrics with entries', () => {
      const mockEntry = {
        name: 'largest-contentful-paint',
        entryType: 'largest-contentful-paint',
        startTime: 1234.5,
        duration: 0,
      } as PerformanceEntry;

      const metric: WebVitalsMetric = {
        id: 'test-id',
        name: 'LCP',
        value: 1234.5,
        delta: 1234.5,
        entries: [mockEntry],
      };

      WebVitalsReporter(metric);

      expect(sendBeaconSpy).toHaveBeenCalled();
      const payload = JSON.parse(sendBeaconSpy.mock.calls[0][1]);
      expect(payload.entries).toHaveLength(1);
    });

    it('should handle fetch failure gracefully', () => {
      Object.defineProperty(global.navigator, 'sendBeacon', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      fetchSpy.mockRejectedValueOnce(new Error('Network error'));
      const metric = createMockMetric('FCP', 1500);

      expect(() => WebVitalsReporter(metric)).not.toThrow();
    });
  });
});
