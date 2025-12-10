/**
 * Performance Alert Service
 *
 * Generates and dispatches alerts when performance metrics exceed configured thresholds.
 */
import { structuredLogger } from '@/lib/logger';
import {
  ALERT_DESTINATION_CONFIG,
  ALERT_SEVERITY,
  ALERTING_THRESHOLDS,
  type AlertSeverity,
  getAlertSeverity,
  getNotificationChannels,
  NOTIFICATION_CHANNELS,
  type NotificationChannel,
} from './alerting-thresholds';

type AlertContext = Record<string, unknown>;

type Alert = {
  id: string;
  timestamp: number;
  severity: AlertSeverity;
  category: string;
  metricName: string;
  value: number;
  threshold?: number;
  source: string;
  context: AlertContext;
};

const alertHistory = new Map<string, number>();

export async function processMetricForAlert(
  category: string,
  name: string,
  value: number,
  additionalInfo: AlertContext = {}
): Promise<Alert | null> {
  const severity = getAlertSeverity(category, name, value);
  if (!severity) return null;

  const alertKey = `${category}.${name}.${severity}`;
  const thresholds = ALERTING_THRESHOLDS[category]?.[name];
  const cooldownPeriod = thresholds?.cooldown ?? 3600; // seconds
  const lastAlertTime = alertHistory.get(alertKey);
  const now = Date.now();
  if (lastAlertTime !== undefined && now - lastAlertTime < cooldownPeriod * 1000) {
    if (process.env.NODE_ENV !== 'production') {
      structuredLogger.warn(
        '[Alert Service] Suppressing alert due to cooldown:',
        `${category}.${name}`,
        { severity }
      );
    }
    return null;
  }

  alertHistory.set(alertKey, now);

  const alert: Alert = {
    id: `perf-${now}-${Math.random().toString(36).slice(2, 10)}`,
    timestamp: now,
    severity,
    category,
    metricName: name,
    value,
    threshold: thresholds?.[severity],
    source: (additionalInfo.source as string) || 'web-vitals',
    context: {
      ...additionalInfo,
      url: additionalInfo.url ?? additionalInfo.page,
      timestamp: (additionalInfo.timestamp as number) ?? now,
    },
  };

  const channels = getNotificationChannels(category, name, severity);

  try {
    await Promise.all(channels.map(channel => dispatchAlert(alert, channel)));
    return alert;
  } catch (error) {
    structuredLogger.error('Alert dispatch failed', error, {
      component: 'alert-service',
      alertId: alert.id,
      metric: alert.metricName,
    });
    return null;
  }
}

async function dispatchAlert(alert: Alert, channel: NotificationChannel): Promise<boolean> {
  switch (channel) {
    case NOTIFICATION_CHANNELS.CONSOLE:
      if (process.env.NODE_ENV !== 'production') {
        const logMessage = `[Performance Alert][${alert.severity.toUpperCase()}] ${alert.category}.${alert.metricName}: ${alert.value}`;
        const logContext = {
          component: 'performance',
          severity: alert.severity,
          metric: `${alert.category}.${alert.metricName}`,
          value: alert.value,
          threshold: alert.threshold,
          alertId: alert.id,
          source: alert.source,
          alertContext: JSON.stringify(alert.context),
        };
        if (alert.severity === ALERT_SEVERITY.INFO) {
          structuredLogger.info(logMessage, logContext);
        } else if (alert.severity === ALERT_SEVERITY.WARNING) {
          structuredLogger.warn(logMessage, logContext);
        } else {
          structuredLogger.error(logMessage, alert, logContext);
        }
      }
      return true;
    case NOTIFICATION_CHANNELS.EMAIL:
      return sendEmailAlert(alert);
    case NOTIFICATION_CHANNELS.SLACK:
      return sendSlackAlert(alert);
    case NOTIFICATION_CHANNELS.WEBHOOK:
      return sendWebhookAlert(alert);
    default:
      return false;
  }
}

async function sendEmailAlert(_alert: Alert): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') {
    structuredLogger.warn('Would send email to', { _alert });
    return true;
  }

  // TODO: implement production email sending
  return true;
}

async function sendSlackAlert(alert: Alert): Promise<boolean> {
  const config = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.SLACK];
  if (!config.webhook || process.env.NODE_ENV !== 'production') {
    return true;
  }

  try {
    const response = await fetch(config.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: config.channel,
        text: `*[PERFORMANCE ALERT - ${alert.severity.toUpperCase()}]* ${alert.category}.${alert.metricName}: ${alert.value}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `⚠️ Performance Alert: ${alert.severity.toUpperCase()}`,
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Metric:* ${alert.category}.${alert.metricName}` },
              { type: 'mrkdwn', text: `*Value:* ${alert.value}` },
              { type: 'mrkdwn', text: `*Threshold:* ${alert.threshold ?? 'N/A'}` },
              { type: 'mrkdwn', text: `*Source:* ${alert.source}` },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*URL:* ${(alert.context.url as string) || 'N/A'}`,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
    structuredLogger.error('Failed to send Slack webhook', error, {
      component: 'performance',
      alertId: alert.id,
    });
    return false;
  }
}

async function sendWebhookAlert(alert: Alert): Promise<boolean> {
  const config = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.WEBHOOK];
  if (!config.url || process.env.NODE_ENV !== 'production') {
    return true;
  }

  try {
    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
    structuredLogger.error('Failed to send webhook alert', error, {
      component: 'performance',
      alertId: alert.id,
    });
    return false;
  }
}

const alertService = { processMetricForAlert };

export default alertService;

export const __TEST_ONLY__ = {
  resetAlertHistory: () => alertHistory.clear(),
};
