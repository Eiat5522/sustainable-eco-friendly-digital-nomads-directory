import {
  ALERT_SEVERITY,
  getAlertSeverity,
  getNotificationChannels,
  NOTIFICATION_CHANNELS,
} from '../alerting-thresholds';

describe('alerting-thresholds', () => {
  describe('getAlertSeverity', () => {
    it('returns null when value does not exceed the warning threshold', () => {
      expect(getAlertSeverity('pageLoad', 'FCP', 1400)).toBeNull();
    });

    it('returns warning or error severities based on configured thresholds', () => {
      expect(getAlertSeverity('pageLoad', 'FCP', 2500)).toBe(ALERT_SEVERITY.WARNING);
      expect(getAlertSeverity('pageLoad', 'FCP', 3600)).toBe(ALERT_SEVERITY.ERROR);
    });

    it('returns critical severity for metrics that define critical thresholds', () => {
      expect(getAlertSeverity('apiResponses', 'listings', 1600)).toBe(ALERT_SEVERITY.CRITICAL);
    });

    it('treats CLS as a lower-is-better metric', () => {
      expect(getAlertSeverity('pageLoad', 'CLS', 0.1)).toBeNull();
      expect(getAlertSeverity('pageLoad', 'CLS', 0.3)).toBe(ALERT_SEVERITY.WARNING);
      expect(getAlertSeverity('pageLoad', 'CLS', 0.6)).toBe(ALERT_SEVERITY.ERROR);
    });
  });

  describe('getNotificationChannels', () => {
    it('returns configured destinations for a metric and severity', () => {
      const channels = getNotificationChannels('pageLoad', 'FCP', ALERT_SEVERITY.ERROR);
      expect(channels).toEqual(
        expect.arrayContaining([
          NOTIFICATION_CHANNELS.CONSOLE,
          NOTIFICATION_CHANNELS.EMAIL,
          NOTIFICATION_CHANNELS.SLACK,
        ])
      );
    });

    it('falls back to default destinations when no custom mapping exists', () => {
      const channels = getNotificationChannels('pageLoad', 'FCP', ALERT_SEVERITY.CRITICAL);
      expect(channels).toEqual(
        expect.arrayContaining([
          NOTIFICATION_CHANNELS.CONSOLE,
          NOTIFICATION_CHANNELS.EMAIL,
          NOTIFICATION_CHANNELS.SLACK,
        ])
      );
    });
  });
});
