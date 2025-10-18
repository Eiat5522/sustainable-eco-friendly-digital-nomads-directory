/**
 * Performance Alert Service (TypeScript)
 * Consolidated from existing JS/TS duplicates to provide a single typed implementation
 */
import {
  ALERTING_THRESHOLDS,
  ALERT_DESTINATION_CONFIG,
  getAlertSeverity,
  getNotificationChannels,
  NOTIFICATION_CHANNELS,
} from './alerting-thresholds';

type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
type NotificationChannel = 'console' | 'email' | 'slack' | 'webhook';

export type Alert = {
  id: string;
  timestamp: number;
  severity: AlertSeverity;
  category: string;
  metricName: string;
  value: number;
  threshold?: number;
  source: string;
  context: Record<string, unknown>;
};

type AlertThresholdConfig = Partial<Record<AlertSeverity, number>> & {
  cooldown?: number;
  destinations?: Partial<Record<AlertSeverity, NotificationChannel[]>>;
};

const alertHistory = new Map<string, number>();

function buildAlert(
  category: string,
  name: string,
  value: number,
  severity: AlertSeverity,
  thresholds: AlertThresholdConfig | undefined,
  additionalInfo: Record<string, unknown>,
  timestamp: number,
): Alert {
  return {
    id: `perf-${timestamp}-${Math.random().toString(36).slice(2, 10)}`,
    timestamp,
    severity,
    category,
    metricName: name,
    value,
    threshold: thresholds?.[severity],
    source: typeof additionalInfo.source === 'string' && additionalInfo.source.length > 0 ? additionalInfo.source : 'web-vitals',
    context: {
      ...additionalInfo,
      url: additionalInfo.url || additionalInfo.page,
      timestamp: additionalInfo.timestamp || timestamp,
    },
  };
}

export async function processMetricForAlert(
  category: string,
  name: string,
  value: number,
  additionalInfo: Record<string, unknown> = {},
): Promise<Alert | null> {
  const severity = getAlertSeverity(category, name, value) as AlertSeverity | null;
  if (!severity) {
    return null;
  }

  const thresholds = (ALERTING_THRESHOLDS as Record<string, Record<string, AlertThresholdConfig | undefined>>)[category]?.[name];
  const cooldownPeriod = thresholds?.cooldown ?? 3600; // seconds
  const alertKey = `${category}.${name}.${severity}`;
  const lastAlertTime = alertHistory.get(alertKey);
  const now = Date.now();

  if (lastAlertTime && now - lastAlertTime < cooldownPeriod * 1000) {
    console.log(`[Alert Service] Still in cooldown period for ${alertKey}`);
    return null;
  }

  alertHistory.set(alertKey, now);

  const alert = buildAlert(category, name, value, severity, thresholds, additionalInfo, now);
  const channels = getNotificationChannels(category, name, severity) as NotificationChannel[];

  try {
    await Promise.all(channels.map((channel) => dispatchAlert(alert, channel)));
    return alert;
  } catch (error) {
    console.error('[Alert Service] Error dispatching alert:', error);
    return null;
  }
}

async function dispatchAlert(alert: Alert, channel: NotificationChannel): Promise<boolean> {
  switch (channel) {
    case NOTIFICATION_CHANNELS.CONSOLE:
      if (process.env.NODE_ENV !== 'production') {
        const logger = alert.severity === 'error' || alert.severity === 'critical' ? console.error : console.warn;
        logger(
          `[Performance Alert][${alert.severity.toUpperCase()}] ${alert.category}.${alert.metricName}: ${alert.value}`,
          alert,
        );
      }
      return true;
    case NOTIFICATION_CHANNELS.EMAIL:
      return sendEmailAlert(alert);
    case NOTIFICATION_CHANNELS.SLACK:
      return sendSlackAlert(alert);
    case NOTIFICATION_CHANNELS.WEBHOOK:
      return sendWebhookAlert(alert);
    default:
      console.warn(`[Alert Service] Unknown notification channel: ${channel}`);
      return false;
  }
}

async function sendEmailAlert(alert: Alert): Promise<boolean> {
  const config = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.EMAIL];

  if (process.env.NODE_ENV !== 'production') {
    const recipients = config?.recipients?.join(', ') ?? 'none';
    console.log(`[Alert Service] Would send email to ${recipients}:`, alert);
    return true;
  }

  // Hook up to an actual email service (SendGrid, Resend, etc.) when available.
  return true;
}

async function sendSlackAlert(alert: Alert): Promise<boolean> {
  const config = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.SLACK];

  if (!config?.webhook || process.env.NODE_ENV !== 'production') {
    console.log(`[Alert Service] Would send Slack message to ${config?.channel ?? '#unknown'}:`, alert);
    return true;
  }

  try {
    const contextUrl = typeof alert.context.url === 'string' ? alert.context.url : 'N/A';

    const response = await fetch(config.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
              text: `*URL:* ${contextUrl}`,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`[Alert Service] Error sending Slack alert: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Alert Service] Error sending Slack alert:', error);
    return false;
  }
}

async function sendWebhookAlert(alert: Alert): Promise<boolean> {
  const config = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.WEBHOOK];

  if (!config?.url || process.env.NODE_ENV !== 'production') {
    console.log('[Alert Service] Would send webhook alert:', alert);
    return true;
  }

  try {
    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alert),
    });

    if (!response.ok) {
      console.error(`[Alert Service] Error sending webhook alert: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Alert Service] Error sending webhook alert:', error);
    return false;
  }
}

const alertService = { processMetricForAlert };

export default alertService;
