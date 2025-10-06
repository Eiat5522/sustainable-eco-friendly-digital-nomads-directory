import { WebVitalsReporter } from '../web-vitals-reporter';
import type { WebVitalsMetric } from '../web-vitals-reporter';

describe('web-vitals-reporter', () => {
  let originalEnv: string | undefined;
  let mockSendBeacon: jest.Mock;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    jest.spyOn(console, 'log').mockImplementation();
    
    // Mock navigator.sendBeacon
    mockSendBeacon = jest.fn().mockReturnValue(true);
    Object.defineProperty(global.navigator, 'sendBeacon', {
      writable: true,
      value: mockSendBeacon,
    });

    // Mock fetch
    mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    global.fetch = mockFetch;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  const createMockMetric = (overrides?: Partial<WebVitalsMetric>): WebVitalsMetric => ({
    id: 'v1-1234567890',
    name: 'CLS',
    value: 0.05,
    delta: 0.05,
    entries: [] as PerformanceEntry[],
    ...overrides,
  });

  describe('WebVitalsReporter', () => {
    it('should log metric in development mode', () => {
      process.env.NODE_ENV = 'development';
      const metric = createMockMetric();

      WebVitalsReporter(metric);

      expect(console.log).toHaveBeenCalledWith('Web Vitals:', {
        name: 'CLS',
        value: 0.05,
        delta: 0.05,
      });
    });

    it('should not log metric in production mode', () => {
      process.env.NODE_ENV = 'production';
      const metric = createMockMetric();

      WebVitalsReporter(metric);

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should use sendBeacon when available', () => {
      const metric = createMockMetric();

      WebVitalsReporter(metric);

      expect(mockSendBeacon).toHaveBeenCalledWith(
        '/api/performance/web-vitals',
        JSON.stringify(metric)
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fall back to fetch when sendBeacon is not available', () => {
      Object.defineProperty(global.navigator, 'sendBeacon', {
        writable: true,
        value: undefined,
      });
      const metric = createMockMetric();

      WebVitalsReporter(metric);

      expect(mockFetch).toHaveBeenCalledWith('/api/performance/web-vitals', {
        body: JSON.stringify(metric),
        method: 'POST',
        keepalive: true,
      });
      expect(mockSendBeacon).not.toHaveBeenCalled();
    });

    it('should handle different metric types', () => {
      const metricTypes = ['CLS', 'FCP', 'FID', 'LCP', 'TTFB', 'INP'];

      metricTypes.forEach((metricType) => {
        mockSendBeacon.mockClear();
        const metric = createMockMetric({ name: metricType });

        WebVitalsReporter(metric);

        expect(mockSendBeacon).toHaveBeenCalledWith(
          '/api/performance/web-vitals',
          expect.stringContaining(metricType)
        );
      });
    });

    it('should handle metric with large values', () => {
      const metric = createMockMetric({
        name: 'LCP',
        value: 10000,
        delta: 5000,
      });

      WebVitalsReporter(metric);

      expect(mockSendBeacon).toHaveBeenCalledWith(
        '/api/performance/web-vitals',
        expect.stringContaining('"value":10000')
      );
    });

    it('should handle metric with zero values', () => {
      const metric = createMockMetric({
        name: 'FID',
        value: 0,
        delta: 0,
      });

      WebVitalsReporter(metric);

      expect(mockSendBeacon).toHaveBeenCalledWith(
        '/api/performance/web-vitals',
        expect.stringContaining('"value":0')
      );
    });

    it('should handle metric with decimal values', () => {
      const metric = createMockMetric({
        name: 'CLS',
        value: 0.123456,
        delta: 0.001234,
      });

      WebVitalsReporter(metric);

      const callArgs = mockSendBeacon.mock.calls[0];
      const sentData = JSON.parse(callArgs[1]);
      
      expect(sentData.value).toBe(0.123456);
      expect(sentData.delta).toBe(0.001234);
    });

    it('should include all metric properties in sent data', () => {
      const metric = createMockMetric({
        id: 'unique-id-123',
        name: 'LCP',
        value: 2500,
        delta: 100,
      });

      WebVitalsReporter(metric);

      const callArgs = mockSendBeacon.mock.calls[0];
      const sentData = JSON.parse(callArgs[1]);
      
      expect(sentData.id).toBe('unique-id-123');
      expect(sentData.name).toBe('LCP');
      expect(sentData.value).toBe(2500);
      expect(sentData.delta).toBe(100);
    });

    it('should handle sendBeacon returning false', () => {
      mockSendBeacon.mockReturnValue(false);
      const metric = createMockMetric();

      // Should still call sendBeacon even if it returns false
      WebVitalsReporter(metric);

      expect(mockSendBeacon).toHaveBeenCalled();
    });

    it('should serialize metric correctly', () => {
      const metric = createMockMetric({
        id: 'test-123',
        name: 'FCP',
        value: 1800,
        delta: 200,
      });

      WebVitalsReporter(metric);

      const callArgs = mockSendBeacon.mock.calls[0];
      const sentData = JSON.parse(callArgs[1]);
      
      expect(sentData).toEqual(expect.objectContaining({
        id: 'test-123',
        name: 'FCP',
        value: 1800,
        delta: 200,
        entries: [],
      }));
    });
  });

  describe('Type exports', () => {
    it('should export WebVitalsMetric type', () => {
      const metric: WebVitalsMetric = {
        id: 'test',
        name: 'CLS',
        value: 0.1,
        delta: 0.1,
        entries: [],
      };

      expect(metric).toBeDefined();
    });
  });
});
