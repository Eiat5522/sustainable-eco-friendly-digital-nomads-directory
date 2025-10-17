/**
 * Performance Alert Service (TypeScript)
 * Consolidated from existing JS/TS duplicates to provide a single typed implementation
 */
import {
  ALERTING_THRESHOLDS,
  getAlertSeverity,
  getNotificationChannels,
  NOTIFICATION_CHANNELS,
  ALERT_DESTINATION_CONFIG,
} from './alerting-thresholds';

type Alert = {
  id: string;
  timestamp: number;
  severity: string;
  category: string;
  metricName: string;
  value: number;
  threshold?: any;
  source?: string;
  context?: Record<string, any>;
};

const alertHistory = new Map<string, number>();

export async function processMetricForAlert(
  category: string,
  name: string,
  value: number,
  additionalInfo: Record<string, any> = {}
): Promise<Alert | null> {
  const severity = getAlertSeverity(category, name, value);
  if (!severity) return null;

  const alertKey = `${category}.${name}.${severity}`;
  const thresholds = (ALERTING_THRESHOLDS as any)[category]?.[name];
  const cooldownPeriod = thresholds?.cooldown || 3600; // seconds
  const lastAlertTime = alertHistory.get(alertKey);
  const now = Date.now();
  if (lastAlertTime && now - lastAlertTime < cooldownPeriod * 1000) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Alert Service] Still in cooldown for ${alertKey}`);
    }
    return null;
  }

  alertHistory.set(alertKey, now);

  const alert: Alert = {
    id: `perf-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    timestamp: now,
    severity,
    category,
    metricName: name,
    value,
    threshold: thresholds?.[severity],
    source: additionalInfo.source || 'web-vitals',
    context: { ...additionalInfo, url: additionalInfo.url || additionalInfo.page, timestamp: additionalInfo.timestamp || now },
  };

  const channels = getNotificationChannels(category, name, severity);

  try {
    await Promise.all(channels.map((ch: string) => dispatchAlert(alert, ch)));
    return alert;
  } catch (error) {
    console.error('[Alert Service] Error dispatching alert', error);
    return null;
  }
}

async function dispatchAlert(alert: Alert, channel: string): Promise<boolean> {
  switch (channel) {
    case NOTIFICATION_CHANNELS.CONSOLE:
      if (process.env.NODE_ENV !== 'production') {
        (alert.severity === 'error' || alert.severity === 'critical') ? console.error(alert) : console.warn(alert);
      }
      return true;
    case NOTIFICATION_CHANNELS.EMAIL:
      return sendEmailAlert(alert);
    case NOTIFICATION_CHANNELS.SLACK:
      return sendSlackAlert(alert);
    case NOTIFICATION_CHANNELS.WEBHOOK:
      return sendWebhookAlert(alert);
    default:
      console.warn('[Alert Service] Unknown channel', channel);
      return false;
  }
}

async function sendEmailAlert(alert: Alert): Promise<boolean> {
  const config = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.EMAIL] || { recipients: [] };
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Alert Service] Would send email to ${config.recipients?.join?.(', ') || 'none'}`, alert);
    return true;
  }
  // TODO: implement production email sending
  return true;
}

async function sendSlackAlert(alert: Alert): Promise<boolean> {
  const config = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.SLACK] || {};
  if (!config.webhook || process.env.NODE_ENV !== 'production') {
    console.log('[Alert Service] Would send Slack message', alert);
    return true;
  }
  try {
    const response = await fetch(config.webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: config.channel,
        text: `*[PERFORMANCE ALERT - ${alert.severity.toUpperCase()}]* ${alert.category}.${alert.metricName}: ${alert.value}`,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('[Alert Service] Slack error', error);
    return false;
  }
}

async function sendWebhookAlert(alert: Alert): Promise<boolean> {
  const config = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.WEBHOOK] || {};
  if (!config.url || process.env.NODE_ENV !== 'production') {
    console.log('[Alert Service] Would send webhook alert', alert);
    return true;
  }
  try {
    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });
    return response.ok;
  } catch (error) {
    console.error('[Alert Service] Webhook error', error);
    return false;
  }
}

export default { processMetricForAlert };
// (consolidated implementation above is exported)
