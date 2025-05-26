/**
 * Performance Alert Service
 * 
 * This module provides functions to generate and dispatch performance alerts
 * when metrics exceed defined thresholds.
 * 
 * @version 1.0.0
 * @date May 15, 2025
 */

import { 
  ALERTING_THRESHOLDS,
  getAlertSeverity,
  getNotificationChannels,
  NOTIFICATION_CHANNELS,
  ALERT_DESTINATION_CONFIG
} from './alerting-thresholds';

// Keep track of when alerts were last sent to implement cooldown periods
const alertHistory = new Map();

/**
 * Generate and dispatch an alert for a performance metric if it exceeds thresholds
 * 
 * @param {string} category - The metric category (e.g., 'pageLoad', 'apiResponses')
 * @param {string} name - The specific metric name
 * @param {number} value - The measured value
 * @param {Object} additionalInfo - Additional context for the alert
 * @returns {Object|null} - The dispatched alert or null if no threshold was exceeded or in cooldown
 */
export async function processMetricForAlert(category, name, value, additionalInfo = {}) {
  // Get the severity level for this metric value
  const severity = getAlertSeverity(category, name, value);
  
  // Exit if no threshold was exceeded
  if (!severity) return null;
  
  // Check if we're still in a cooldown period for this alert
  const alertKey = `${category}.${name}.${severity}`;
  const thresholds = ALERTING_THRESHOLDS[category]?.[name];
  const cooldownPeriod = thresholds?.cooldown || 3600; // Default 1 hour cooldown
  const lastAlertTime = alertHistory.get(alertKey);
  
  const now = Date.now();
  if (lastAlertTime && (now - lastAlertTime < cooldownPeriod * 1000)) {
    console.log(`[Alert Service] Still in cooldown period for ${alertKey}`);
    return null;
  }
  
  // Update the last alert time
  alertHistory.set(alertKey, now);
  
  // Construct the alert
  const alert = {
    id: `perf-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
    timestamp: now,
    severity,
    category,
    metricName: name,
    value,
    threshold: thresholds?.[severity],
    source: additionalInfo.source || 'web-vitals',
    context: {
      ...additionalInfo,
      url: additionalInfo.url || additionalInfo.page,
      timestamp: additionalInfo.timestamp || now,
    }
  };
  
  // Get notification channels for this alert
  const channels = getNotificationChannels(category, name, severity);
  
  // Dispatch the alert to each configured channel
  try {
    await Promise.all(channels.map(channel => 
      dispatchAlert(alert, channel)
    ));
    
    return alert;
  } catch (error) {
    console.error(`[Alert Service] Error dispatching alert:`, error);
    return null;
  }
}

/**
 * Dispatch an alert to a specific notification channel
 * 
 * @param {Object} alert - The alert object
 * @param {string} channel - The notification channel
 * @returns {Promise} - A promise that resolves when the alert is dispatched
 */
async function dispatchAlert(alert, channel) {
  switch (channel) {
    case NOTIFICATION_CHANNELS.CONSOLE:
      // Always log to console in development
      if (process.env.NODE_ENV !== 'production') {
        console[alert.severity === 'error' || alert.severity === 'critical' ? 'error' : 'warn'](
          `[Performance Alert][${alert.severity.toUpperCase()}] ${alert.category}.${alert.metricName}: ${alert.value}`,
          alert
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

/**
 * Send an alert via email
 * 
 * @param {Object} alert - The alert object
 * @returns {Promise} - A promise that resolves when the email is sent
 */
async function sendEmailAlert(alert) {
  // In a real implementation, this would use an email service
  const config = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.EMAIL];
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Alert Service] Would send email to ${config.recipients.join(', ')}:`, alert);
    return true;
  }
  
  // Here you would use something like Nodemailer, SendGrid, etc.
  // For production, this would be replaced with actual email sending logic
  
  return true;
}

/**
 * Send an alert to Slack
 * 
 * @param {Object} alert - The alert object
 * @returns {Promise} - A promise that resolves when the alert is sent
 */
async function sendSlackAlert(alert) {
  const config = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.SLACK];
  
  if (!config.webhook || process.env.NODE_ENV !== 'production') {
    console.log(`[Alert Service] Would send Slack message to ${config.channel}:`, alert);
    return true;
  }
  
  // For production, this would be replaced with actual Slack integration
  try {
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
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Metric:* ${alert.category}.${alert.metricName}`
              },
              {
                type: 'mrkdwn',
                text: `*Value:* ${alert.value}`
              },
              {
                type: 'mrkdwn',
                text: `*Threshold:* ${alert.threshold}`
              },
              {
                type: 'mrkdwn',
                text: `*Source:* ${alert.source}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*URL:* ${alert.context.url || 'N/A'}`
            }
          }
        ]
      }),
    });
    
    if (!response.ok) {
      console.error(`[Alert Service] Error sending Slack alert: ${response.status} ${response.statusText}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`[Alert Service] Error sending Slack alert:`, error);
    return false;
  }
}

/**
 * Send an alert to a webhook
 * 
 * @param {Object} alert - The alert object
 * @returns {Promise} - A promise that resolves when the alert is sent
 */
async function sendWebhookAlert(alert) {
  const config = ALERT_DESTINATION_CONFIG[NOTIFICATION_CHANNELS.WEBHOOK];
  
  if (!config.url || process.env.NODE_ENV !== 'production') {
    console.log(`[Alert Service] Would send webhook alert:`, alert);
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
    console.error(`[Alert Service] Error sending webhook alert:`, error);
    return false;
  }
}

export default {
  processMetricForAlert,
};
