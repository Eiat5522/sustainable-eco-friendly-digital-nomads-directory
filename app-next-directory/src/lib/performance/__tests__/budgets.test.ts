import {
  PERFORMANCE_BUDGETS,
  ALERT_CHANNELS,
  shouldAlert,
  sendAlert,
  type PerformanceAlert,
  type AlertSeverity,
} from '../budgets';

describe('budgets', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();

    mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    global.fetch = mockFetch;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('PERFORMANCE_BUDGETS', () => {
    it('should export performance budgets object', () => {
      expect(PERFORMANCE_BUDGETS).toBeDefined();
      expect(typeof PERFORMANCE_BUDGETS).toBe('object');
    });

    it('should have webVitals budgets', () => {
      expect(PERFORMANCE_BUDGETS.webVitals).toBeDefined();
      expect(PERFORMANCE_BUDGETS.webVitals.CLS).toEqual({ target: 0.1, limit: 0.25 });
      expect(PERFORMANCE_BUDGETS.webVitals.FCP).toEqual({ target: 1800, limit: 3000 });
      expect(PERFORMANCE_BUDGETS.webVitals.FID).toEqual({ target: 100, limit: 300 });
      expect(PERFORMANCE_BUDGETS.webVitals.INP).toEqual({ target: 200, limit: 500 });
      expect(PERFORMANCE_BUDGETS.webVitals.LCP).toEqual({ target: 2500, limit: 4000 });
      expect(PERFORMANCE_BUDGETS.webVitals.TTFB).toEqual({ target: 800, limit: 1800 });
    });

    it('should have resources budgets', () => {
      expect(PERFORMANCE_BUDGETS.resources).toBeDefined();
      expect(PERFORMANCE_BUDGETS.resources.total).toEqual({ target: 900, limit: 1200 });
      expect(PERFORMANCE_BUDGETS.resources.js).toEqual({ target: 350, limit: 500 });
      expect(PERFORMANCE_BUDGETS.resources.css).toEqual({ target: 75, limit: 100 });
      expect(PERFORMANCE_BUDGETS.resources.images).toEqual({ target: 400, limit: 600 });
      expect(PERFORMANCE_BUDGETS.resources.fonts).toEqual({ target: 75, limit: 125 });
    });

    it('should have api budgets', () => {
      expect(PERFORMANCE_BUDGETS.api).toBeDefined();
      expect(PERFORMANCE_BUDGETS.api.listings).toEqual({ target: 300, limit: 600 });
      expect(PERFORMANCE_BUDGETS.api.search).toEqual({ target: 500, limit: 800 });
      expect(PERFORMANCE_BUDGETS.api.map).toEqual({ target: 400, limit: 700 });
    });

    it('should have features budgets', () => {
      expect(PERFORMANCE_BUDGETS.features).toBeDefined();
      expect(PERFORMANCE_BUDGETS.features.mapInitialization).toEqual({ target: 800, limit: 1200 });
      expect(PERFORMANCE_BUDGETS.features.searchResults).toEqual({ target: 500, limit: 800 });
      expect(PERFORMANCE_BUDGETS.features.filterApplication).toEqual({ target: 200, limit: 400 });
    });
  });

  describe('ALERT_CHANNELS', () => {
    it('should have console channel enabled by default', () => {
      expect(ALERT_CHANNELS.console.enabled).toBe(true);
      expect(ALERT_CHANNELS.console.minSeverity).toBe('warning');
    });

    it('should enable slack channel when webhook URL is set', () => {
      process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      const { ALERT_CHANNELS: channels } = require('../budgets');
      
      expect(channels.slack.enabled).toBe(true);
      expect(channels.slack.minSeverity).toBe('error');
    });

    it('should enable email channel when email is set', () => {
      process.env.NEXT_PUBLIC_ALERT_EMAIL = 'test@example.com';
      const { ALERT_CHANNELS: channels } = require('../budgets');
      
      expect(channels.email.enabled).toBe(true);
      expect(channels.email.minSeverity).toBe('error');
    });
  });

  describe('shouldAlert', () => {
    it('should return null when metric is within target', () => {
      const result = shouldAlert('CLS', 0.05, 'webVitals');
      expect(result).toBeNull();
    });

    it('should return warning alert when value exceeds target but not limit', () => {
      const result = shouldAlert('CLS', 0.15, 'webVitals');
      
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('warning');
      expect(result?.metric).toBe('CLS');
      expect(result?.value).toBe(0.15);
      expect(result?.threshold).toBe(0.25);
    });

    it('should return error alert when value exceeds limit', () => {
      const result = shouldAlert('CLS', 0.3, 'webVitals');
      
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('error');
      expect(result?.metric).toBe('CLS');
      expect(result?.value).toBe(0.3);
    });

    it('should return critical alert when value exceeds limit * 1.5', () => {
      const result = shouldAlert('CLS', 0.4, 'webVitals');
      
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('critical');
      expect(result?.metric).toBe('CLS');
      expect(result?.value).toBe(0.4);
    });

    it('should return null for unknown metric', () => {
      const result = shouldAlert('UNKNOWN', 100, 'webVitals');
      expect(result).toBeNull();
    });

    it('should work with resources budgets', () => {
      const result = shouldAlert('js', 450, 'resources');
      
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('warning');
      expect(result?.metric).toBe('js');
    });

    it('should work with api budgets', () => {
      const result = shouldAlert('listings', 700, 'api');
      
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('error');
      expect(result?.metric).toBe('listings');
    });

    it('should work with features budgets', () => {
      const result = shouldAlert('mapInitialization', 900, 'features');
      
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('warning');
      expect(result?.metric).toBe('mapInitialization');
    });

    it('should include timestamp in alert', () => {
      const before = Date.now();
      const result = shouldAlert('LCP', 5000, 'webVitals');
      const after = Date.now();
      
      expect(result).not.toBeNull();
      expect(result?.timestamp).toBeGreaterThanOrEqual(before);
      expect(result?.timestamp).toBeLessThanOrEqual(after);
    });

    it('should handle edge case at exact target value', () => {
      const result = shouldAlert('CLS', 0.1, 'webVitals');
      expect(result).toBeNull();
    });

    it('should handle edge case at exact limit value', () => {
      const result = shouldAlert('CLS', 0.25, 'webVitals');
      
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('warning');
    });
  });

  describe('sendAlert', () => {
    const createAlert = (severity: AlertSeverity = 'warning'): PerformanceAlert => ({
      metric: 'CLS',
      value: 0.3,
      threshold: 0.25,
      severity,
      timestamp: Date.now(),
    });

    it('should log to console when console channel is enabled', async () => {
      const alert = createAlert('warning');
      
      await sendAlert(alert);
      
      expect(console.log).toHaveBeenCalledWith(
        '[Performance WARNING] CLS: 0.3 (threshold: 0.25)'
      );
    });

    it('should log with correct severity format', async () => {
      const testCases: AlertSeverity[] = ['info', 'warning', 'error', 'critical'];
      
      for (const severity of testCases) {
        (console.log as jest.Mock).mockClear();
        const alert = createAlert(severity);
        
        await sendAlert(alert);
        
        expect(console.log).toHaveBeenCalledWith(
          expect.stringContaining(`[Performance ${severity.toUpperCase()}]`)
        );
      }
    });

    it('should not send slack alert when channel is disabled', async () => {
      const alert = createAlert('error');
      
      await sendAlert(alert);
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should send slack alert when channel is enabled and severity meets threshold', async () => {
      process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      
      // Re-import to get updated ALERT_CHANNELS
      jest.resetModules();
      const { sendAlert: sendAlertFn } = require('../budgets');
      
      const alert = createAlert('error');
      await sendAlertFn(alert);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('CLS'),
        })
      );
    });

    it('should not send slack alert when severity is below threshold', async () => {
      process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      
      jest.resetModules();
      const { sendAlert: sendAlertFn } = require('../budgets');
      
      const alert = createAlert('warning');
      await sendAlertFn(alert);
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle slack webhook failure gracefully', async () => {
      process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      jest.resetModules();
      const { sendAlert: sendAlertFn } = require('../budgets');
      
      const alert = createAlert('error');
      
      await expect(sendAlertFn(alert)).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send Slack alert:',
        expect.any(Error)
      );
    });

    it('should format slack message correctly', async () => {
      process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      
      jest.resetModules();
      const { sendAlert: sendAlertFn } = require('../budgets');
      
      const alert = createAlert('critical');
      await sendAlertFn(alert);
      
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      
      expect(body.text).toContain('🚨 Performance Alert (CRITICAL)');
      expect(body.text).toContain('Metric: CLS');
      expect(body.text).toContain('Value: 0.3');
      expect(body.text).toContain('Threshold: 0.25');
      expect(body.text).toContain('Time:');
    });

    it('should handle multiple alerts sequentially', async () => {
      const alerts = [
        createAlert('warning'),
        createAlert('error'),
        createAlert('critical'),
      ];
      
      for (const alert of alerts) {
        await expect(sendAlert(alert)).resolves.not.toThrow();
      }
      
      expect(console.log).toHaveBeenCalledTimes(3);
    });
  });

  describe('Type exports', () => {
    it('should export AlertSeverity type', () => {
      const severities: AlertSeverity[] = ['info', 'warning', 'error', 'critical'];
      expect(severities).toHaveLength(4);
    });

    it('should export PerformanceAlert interface', () => {
      const alert: PerformanceAlert = {
        metric: 'test',
        value: 100,
        threshold: 50,
        severity: 'warning',
        timestamp: Date.now(),
        context: { extra: 'data' },
      };
      
      expect(alert).toBeDefined();
      expect(alert.context?.extra).toBe('data');
    });
  });
});
