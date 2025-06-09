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

// Alert configuration for different channels
export const ALERT_CHANNELS = {
  console: {
    enabled: true,
    minSeverity: 'warning'
  },
  slack: {
    enabled: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL !== undefined,
    minSeverity: 'error',
    webhookUrl: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL
  },
  email: {
    enabled: process.env.NEXT_PUBLIC_ALERT_EMAIL !== undefined,
    minSeverity: 'error',
    recipient: process.env.NEXT_PUBLIC_ALERT_EMAIL
  }
}

// Alert severity levels
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

// Alert message structure
export interface PerformanceAlert {
  metric: string
  value: number
  threshold: number
  severity: AlertSeverity
  timestamp: number
  context?: Record<string, any>
}

/**
 * Determines if a metric should trigger an alert
 */
export function shouldAlert(
  metricName: string,
  value: number,
  type: 'webVitals' | 'resources' | 'api' | 'features'
): PerformanceAlert | null {
  const budget = PERFORMANCE_BUDGETS[type][metricName]
  if (!budget) return null

  let severity: AlertSeverity = 'info'
  if (value > budget.limit * 1.5) severity = 'critical'
  else if (value > budget.limit) severity = 'error'
  else if (value > budget.target) severity = 'warning'
  else return null

  return {
    metric: metricName,
    value,
    threshold: budget.limit,
    severity,
    timestamp: Date.now()
  }
}

/**
 * Sends an alert through configured channels
 */
export async function sendAlert(alert: PerformanceAlert) {
  // Console logging (development & production)
  if (ALERT_CHANNELS.console.enabled) {
    const severity = alert.severity.toUpperCase()
    console.log(
      `[Performance ${severity}] ${alert.metric}: ${alert.value} (threshold: ${alert.threshold})`
    )
  }

  // Slack alerts (if configured)
  if (ALERT_CHANNELS.slack.enabled && alert.severity >= ALERT_CHANNELS.slack.minSeverity) {
    try {
      await fetch(ALERT_CHANNELS.slack.webhookUrl!, {
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
  if (ALERT_CHANNELS.email.enabled && alert.severity >= ALERT_CHANNELS.email.minSeverity) {
    // Implement email sending logic here
    // You might want to use a service like SendGrid or Amazon SES
  }
}
