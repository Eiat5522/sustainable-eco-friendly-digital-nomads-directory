import {
  PERFORMANCE_BUDGETS,
  ALERT_CHANNELS,
  shouldAlert,
  sendAlert,
  type PerformanceAlert,
  type AlertSeverity,
} from '../budgets';

describe('budgets', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let fetchMock: jest.Mock;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.env = originalEnv;
  });

  describe('PERFORMANCE_BUDGETS', () => {
    it('should have webVitals budgets defined', () => {
      expect(PERFORMANCE_BUDGETS.webVitals).toBeDefined();
      expect(PERFORMANCE_BUDGETS.webVitals.CLS).toEqual({ target: 0.1, limit: 0.25 });
      expect(PERFORMANCE_BUDGETS.webVitals.FCP).toEqual({ target: 1800, limit: 3000 });
      expect(PERFORMANCE_BUDGETS.webVitals.FID).toEqual({ target: 100, limit: 300 });
      expect(PERFORMANCE_BUDGETS.webVitals.INP).toEqual({ target: 200, limit: 500 });
      expect(PERFORMANCE_BUDGETS.webVitals.LCP).toEqual({ target: 2500, limit: 4000 });
      expect(PERFORMANCE_BUDGETS.webVitals.TTFB).toEqual({ target: 800, limit: 1800 });
    });

    it('should have resources budgets defined', () => {
      expect(PERFORMANCE_BUDGETS.resources).toBeDefined();
      expect(PERFORMANCE_BUDGETS.resources.total).toEqual({ target: 900, limit: 1200 });
      expect(PERFORMANCE_BUDGETS.resources.js).toEqual({ target: 350, limit: 500 });
      expect(PERFORMANCE_BUDGETS.resources.css).toEqual({ target: 75, limit: 100 });
      expect(PERFORMANCE_BUDGETS.resources.images).toEqual({ target: 400, limit: 600 });
      expect(PERFORMANCE_BUDGETS.resources.fonts).toEqual({ target: 75, limit: 125 });
    });

    it('should have api budgets defined', () => {
      expect(PERFORMANCE_BUDGETS.api).toBeDefined();
      expect(PERFORMANCE_BUDGETS.api.listings).toEqual({ target: 300, limit: 600 });
      expect(PERFORMANCE_BUDGETS.api.search).toEqual({ target: 500, limit: 800 });
      expect(PERFORMANCE_BUDGETS.api.map).toEqual({ target: 400, limit: 700 });
    });

    it('should have features budgets defined', () => {
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

    it('should enable slack when webhook URL is defined', () => {
      process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      const { ALERT_CHANNELS: channels } = require('../budgets');
      expect(channels.slack.enabled).toBe(true);
      expect(channels.slack.minSeverity).toBe('error');
    });

    it('should enable email when alert email is defined', () => {
      process.env.NEXT_PUBLIC_ALERT_EMAIL = 'alerts@example.com';
      const { ALERT_CHANNELS: channels } = require('../budgets');
      expect(channels.email.enabled).toBe(true);
      expect(channels.email.minSeverity).toBe('error');
    });
  });

  describe('shouldAlert', () => {
    it('should return null when metric is below target', () => {
      const result = shouldAlert('CLS', 0.05, 'webVitals');
      expect(result).toBeNull();
    });

    it('should return warning alert when metric exceeds target but not limit', () => {
      const result = shouldAlert('CLS', 0.15, 'webVitals');
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('warning');
      expect(result?.metric).toBe('CLS');
      expect(result?.value).toBe(0.15);
    });

    it('should return error alert when metric exceeds limit', () => {
      const result = shouldAlert('LCP', 4500, 'webVitals');
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('error');
      expect(result?.metric).toBe('LCP');
      expect(result?.value).toBe(4500);
    });

    it('should return critical alert when metric exceeds limit * 1.5', () => {
      const result = shouldAlert('FCP', 4500, 'webVitals'); // limit is 3000, 1.5x = 4500
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('critical');
    });

    it('should return null for non-existent metric', () => {
      const result = shouldAlert('INVALID_METRIC', 1000, 'webVitals');
      expect(result).toBeNull();
    });

    it('should work with resources budgets', () => {
      const result = shouldAlert('js', 450, 'resources');
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('warning');
    });

    it('should work with api budgets', () => {
      const result = shouldAlert('listings', 650, 'api');
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('error');
    });

    it('should work with features budgets', () => {
      const result = shouldAlert('mapInitialization', 1000, 'features');
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('warning');
    });

    it('should include timestamp in alert', () => {
      const before = Date.now();
      const result = shouldAlert('FID', 350, 'webVitals');
      const after = Date.now();

      expect(result).not.toBeNull();
      expect(result?.timestamp).toBeGreaterThanOrEqual(before);
      expect(result?.timestamp).toBeLessThanOrEqual(after);
    });

    it('should include threshold in alert', () => {
      const result = shouldAlert('TTFB', 2000, 'webVitals');
      expect(result).not.toBeNull();
      expect(result?.threshold).toBe(1800); // TTFB limit
    });

    it('should handle edge case of value exactly at target', () => {
      const result = shouldAlert('CLS', 0.1, 'webVitals');
      expect(result).toBeNull(); // At target, not above
    });

    it('should handle edge case of value exactly at limit', () => {
      const result = shouldAlert('CLS', 0.25, 'webVitals');
      expect(result).toBeNull(); // At limit, not above
    });

    it('should handle very large values', () => {
      const result = shouldAlert('LCP', 50000, 'webVitals');
      expect(result).not.toBeNull();
      expect(result?.severity).toBe('critical');
    });
  });

  describe('sendAlert', () => {
    const mockAlert: PerformanceAlert = {
      metric: 'LCP',
      value: 4500,
      threshold: 4000,
      severity: 'error',
      timestamp: Date.now(),
    };

    it('should log to console when console channel is enabled', async () => {
      await sendAlert(mockAlert);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Performance ERROR]'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('LCP: 4500')
      );
    });

    it('should send to Slack when enabled and severity meets threshold', async () => {
      const slackWebhookUrl = 'https://hooks.slack.com/services/test';
      process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL = slackWebhookUrl;
      
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      // Re-import to get updated ALERT_CHANNELS
      jest.resetModules();
      const { sendAlert: sendAlertReloaded, ALERT_CHANNELS: channels } = require('../budgets');
      
      expect(channels.slack.enabled).toBe(true);

      await sendAlertReloaded(mockAlert);

      expect(fetchMock).toHaveBeenCalledWith(
        slackWebhookUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('LCP'),
        })
      );
    });

    it('should handle Slack webhook failure gracefully', async () => {
      process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      jest.resetModules();
      const { sendAlert: sendAlertReloaded } = require('../budgets');

      await expect(sendAlertReloaded(mockAlert)).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to send Slack alert:',
        expect.any(Error)
      );
    });

    it('should not send to Slack if severity is below threshold', async () => {
      process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';

      jest.resetModules();
      const { sendAlert: sendAlertReloaded } = require('../budgets');

      const warningAlert: PerformanceAlert = {
        ...mockAlert,
        severity: 'warning',
      };

      await sendAlertReloaded(warningAlert);

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should handle info severity', async () => {
      const infoAlert: PerformanceAlert = {
        ...mockAlert,
        severity: 'info',
      };

      await sendAlert(infoAlert);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Performance INFO]')
      );
    });

    it('should handle critical severity', async () => {
      const criticalAlert: PerformanceAlert = {
        ...mockAlert,
        severity: 'critical',
      };

      await sendAlert(criticalAlert);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Performance CRITICAL]')
      );
    });

    it('should format timestamp correctly in Slack message', async () => {
      process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      
      fetchMock.mockResolvedValueOnce({ ok: true });

      jest.resetModules();
      const { sendAlert: sendAlertReloaded } = require('../budgets');

      const alertWithTimestamp: PerformanceAlert = {
        ...mockAlert,
        timestamp: new Date('2025-01-15T10:30:00Z').getTime(),
      };

      await sendAlertReloaded(alertWithTimestamp);

      const fetchCall = fetchMock.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.text).toContain('2025-01-15');
    });

    it('should include all alert properties in Slack message', async () => {
      process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      
      fetchMock.mockResolvedValueOnce({ ok: true });

      jest.resetModules();
      const { sendAlert: sendAlertReloaded } = require('../budgets');

      await sendAlertReloaded(mockAlert);

      const fetchCall = fetchMock.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      
      expect(body.text).toContain('LCP');
      expect(body.text).toContain('4500');
      expect(body.text).toContain('4000');
      expect(body.text).toContain('ERROR');
    });
  });

  describe('AlertSeverity type', () => {
    it('should accept valid severity levels', () => {
      const severities: AlertSeverity[] = ['info', 'warning', 'error', 'critical'];
      expect(severities).toHaveLength(4);
    });
  });

  describe('PerformanceAlert interface', () => {
    it('should create a valid alert object', () => {
      const alert: PerformanceAlert = {
        metric: 'FCP',
        value: 2000,
        threshold: 1800,
        severity: 'warning',
        timestamp: Date.now(),
        context: { page: '/home' },
      };

      expect(alert.metric).toBe('FCP');
      expect(alert.context).toEqual({ page: '/home' });
    });
  });
});
