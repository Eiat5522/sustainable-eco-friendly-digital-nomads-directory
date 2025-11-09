/**
 * Performance Budgets and Alerts Configuration
 *
 * This module defines performance budgets for the application and
 * configures alerting thresholds for when metrics exceed budgets.
 *
 * @version 1.0.0
 * @date May 18, 2025
 */

export const PERFORMANCE_BUDGETS = {
  // Core Web Vitals budgets
  webVitals: {
    CLS: { target: 0.1, limit: 0.25 },
    FCP: { target: 1800, limit: 3000 },
    FID: { target: 100, limit: 300 },
    INP: { target: 200, limit: 500 },
    LCP: { target: 2500, limit: 4000 },
    TTFB: { target: 800, limit: 1800 }
  },

  // Resource size budgets (in KB)
  resources: {
    total: { target: 900, limit: 1200 },
    js: { target: 350, limit: 500 },
    css: { target: 75, limit: 100 },
    images: { target: 400, limit: 600 },
    fonts: { target: 75, limit: 125 }
  },

  // API response time budgets (in ms)
  api: {
    listings: { target: 300, limit: 600 },
    search: { target: 500, limit: 800 },
    map: { target: 400, limit: 700 }
  },

  // Feature-specific budgets (in ms)
  features: {
    mapInitialization: { target: 800, limit: 1200 },
    searchResults: { target: 500, limit: 800 },
    filterApplication: { target: 200, limit: 400 }
  }
}

// Alert severity levels
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

export const SEVERITY_LEVELS: { [key in AlertSeverity]: number } = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3,
};

// Alert message structure
export interface PerformanceAlert {
  metric: string
  value: number
  threshold: number
  severity: AlertSeverity
  timestamp: number
  context?: Record<string, unknown>
}

interface BaseChannelConfig {
  readonly enabled: boolean
  readonly minSeverity: AlertSeverity
}

interface SlackChannelConfig extends BaseChannelConfig {
  readonly webhookUrl?: string
}

interface EmailChannelConfig extends BaseChannelConfig {
  readonly recipient?: string
}

interface AlertChannels {
  readonly console: BaseChannelConfig
  readonly slack: SlackChannelConfig
  readonly email: EmailChannelConfig
}

const severityRanking: Record<AlertSeverity, number> = {
  info: 0,
  warning: 1,
  error: 2,
  critical: 3
}

const meetsSeverityThreshold = (severity: AlertSeverity, minSeverity: AlertSeverity) =>
  severityRanking[severity] >= severityRanking[minSeverity]

/**
 * Determines if a metric should trigger an alert
 */
function isValidMetric(type: keyof typeof PERFORMANCE_BUDGETS, metricName: string): metricName is keyof typeof PERFORMANCE_BUDGETS[typeof type] {
  return metricName in PERFORMANCE_BUDGETS[type];
}

export function shouldAlert(
  metricName: string,
  value: number,
  type: keyof typeof PERFORMANCE_BUDGETS
): PerformanceAlert | null {
  if (!isValidMetric(type, metricName)) return null;

  const budget = (PERFORMANCE_BUDGETS[type] as Record<string, { target: number; limit: number }>)[metricName];
  if (!budget) return null;

  let severity: AlertSeverity = 'info';
  if (value > budget.limit * 1.5) severity = 'critical';
  else if (value > budget.limit) severity = 'error';
  else if (value > budget.target) severity = 'warning';
  else return null;

  return {
    metric: metricName,
    value,
    threshold: budget.limit,
    severity,
    timestamp: Date.now(),
  };
}

/**
 * Sends an alert through configured channels
 */
export async function sendAlert(alert: PerformanceAlert) {
  const slackChannel = ALERT_CHANNELS.slack
  const emailChannel = ALERT_CHANNELS.email
  const fetchFn = typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : null

  // Console logging (development & production)
  if (ALERT_CHANNELS.console.enabled) {
    const severity = alert.severity.toUpperCase()
    console.log(
      `[Performance ${severity}] ${alert.metric}: ${alert.value} (threshold: ${alert.threshold})`
    )
  }

  // Slack alerts (if configured)
  if (
    slackChannel.enabled &&
    slackChannel.webhookUrl &&
    meetsSeverityThreshold(alert.severity, slackChannel.minSeverity) &&
    fetchFn
  ) {
    try {
      await fetchFn(slackChannel.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Performance Alert (${alert.severity.toUpperCase()})\n` +
                `Metric: ${alert.metric}\n` +
                `Value: ${alert.value}\n` +
                `Threshold: ${alert.threshold}\n` +
                `Time: ${new Date(alert.timestamp).toISOString()}`
        })
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }

  // Email alerts (if configured)
  if (emailChannel.enabled && meetsSeverityThreshold(alert.severity, emailChannel.minSeverity)) {
    // Implement email sending logic here
    // You might want to use a service like SendGrid or Amazon SES
  }
}

const createSlackChannelConfig = (): SlackChannelConfig => {
  const webhook = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL?.trim();

  const config: SlackChannelConfig = {
    enabled: Boolean(webhook),
    minSeverity: 'error',
    webhookUrl: webhook || undefined,
  };

  return Object.freeze(config);
}

const createEmailChannelConfig = (): EmailChannelConfig => {
  const recipient = process.env.NEXT_PUBLIC_ALERT_EMAIL?.trim();

  const config: EmailChannelConfig = {
    enabled: Boolean(recipient),
    minSeverity: 'error',
    recipient: recipient || undefined,
  };

  return Object.freeze(config);
}

// Alert configuration for different channels
export const ALERT_CHANNELS: AlertChannels = {
  console: Object.freeze({
    enabled: true,
    minSeverity: 'warning' as AlertSeverity
  }),
  slack: createSlackChannelConfig(),
  email: createEmailChannelConfig()
}
