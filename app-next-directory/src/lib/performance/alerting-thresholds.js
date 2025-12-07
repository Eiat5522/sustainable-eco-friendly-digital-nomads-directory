/**
 * Performance Alerting Thresholds Configuration
 * 
 * This file configures alerting thresholds for various performance metrics
 * based on the performance budgets established for the application.
 * 
 * @version 1.0.0
 * @date May 15, 2025
 */

import { PERFORMANCE_BUDGETS } from './performance-budgets';

/**
 * Alert severity levels
 */
export const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

/**
 * Alert notification channels
 */
export const NOTIFICATION_CHANNELS = {
  CONSOLE: 'console', // Log to console (development only)
  EMAIL: 'email',     // Send email notifications
  SLACK: 'slack',     // Post to Slack channel
  WEBHOOK: 'webhook', // Send to generic webhook
};

/**
 * Default alert destinations by severity
 */
const DEFAULT_ALERT_DESTINATIONS = {
  [ALERT_SEVERITY.INFO]: [NOTIFICATION_CHANNELS.CONSOLE],
  [ALERT_SEVERITY.WARNING]: [NOTIFICATION_CHANNELS.CONSOLE, NOTIFICATION_CHANNELS.SLACK],
  [ALERT_SEVERITY.ERROR]: [NOTIFICATION_CHANNELS.CONSOLE, NOTIFICATION_CHANNELS.SLACK, NOTIFICATION_CHANNELS.EMAIL],
  [ALERT_SEVERITY.CRITICAL]: [NOTIFICATION_CHANNELS.CONSOLE, NOTIFICATION_CHANNELS.SLACK, NOTIFICATION_CHANNELS.EMAIL],
};

/**
 * Configuration for alert destinations
 */
export const ALERT_DESTINATION_CONFIG = {
  [NOTIFICATION_CHANNELS.EMAIL]: {
    recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || ['admin@sustainablenomads.com'],
    from: process.env.ALERT_EMAIL_FROM || 'alerts@sustainablenomads.com',
  },
  [NOTIFICATION_CHANNELS.SLACK]: {
    webhook: process.env.ALERT_SLACK_WEBHOOK,
    channel: process.env.ALERT_SLACK_CHANNEL || '#performance-alerts',
  },
  [NOTIFICATION_CHANNELS.WEBHOOK]: {
    url: process.env.ALERT_WEBHOOK_URL,
    method: 'POST',
  },
};

/**
 * Performance alerting threshold configuration
 */
export const ALERTING_THRESHOLDS = {
  // Page Load Metrics Thresholds
  pageLoad: {
    FCP: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.pageLoad.FCP.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.pageLoad.FCP.critical,
      cooldown: 15 * 60, // 15 minutes between repeat alerts
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    LCP: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.pageLoad.LCP.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.pageLoad.LCP.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    TTI: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.pageLoad.TTI.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.pageLoad.TTI.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    FID: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.pageLoad.FID.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.pageLoad.FID.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    CLS: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.pageLoad.CLS.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.pageLoad.CLS.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    TBT: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.pageLoad.TBT.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.pageLoad.TBT.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
  },
  
  // API Response Time Thresholds
  apiResponses: {
    listings: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.apiResponses.listings.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.apiResponses.listings.critical,
      [ALERT_SEVERITY.CRITICAL]: PERFORMANCE_BUDGETS.apiResponses.listings.critical * 1.5,
      cooldown: 5 * 60, // 5 minutes between repeat alerts
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    search: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.apiResponses.search.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.apiResponses.search.critical,
      [ALERT_SEVERITY.CRITICAL]: PERFORMANCE_BUDGETS.apiResponses.search.critical * 1.5,
      cooldown: 5 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    mapData: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.apiResponses.mapData.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.apiResponses.mapData.critical,
      [ALERT_SEVERITY.CRITICAL]: PERFORMANCE_BUDGETS.apiResponses.mapData.critical * 1.5,
      cooldown: 5 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    userProfile: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.apiResponses.userProfile.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.apiResponses.userProfile.critical,
      [ALERT_SEVERITY.CRITICAL]: PERFORMANCE_BUDGETS.apiResponses.userProfile.critical * 1.5,
      cooldown: 5 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
  },
  
  // Server Resource Utilization Thresholds
  serverResources: {
    cpuUtilization: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.serverResources.cpuUtilization.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.serverResources.cpuUtilization.critical,
      [ALERT_SEVERITY.CRITICAL]: 95, // Near complete CPU saturation
      cooldown: 5 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    memoryUtilization: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.serverResources.memoryUtilization.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.serverResources.memoryUtilization.critical,
      [ALERT_SEVERITY.CRITICAL]: 95, // Near out of memory
      cooldown: 5 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    diskIOUtilization: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.serverResources.diskIOUtilization.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.serverResources.diskIOUtilization.critical,
      cooldown: 10 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
  },
  
  // Component-Specific Thresholds
  components: {
    mapRendering: {
      initialLoad: {
        [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.components.mapRendering.initialLoad.acceptable,
        [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.components.mapRendering.initialLoad.critical,
        cooldown: 15 * 60,
        destinations: DEFAULT_ALERT_DESTINATIONS,
      },
      panZoom: {
        [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.components.mapRendering.panZoom.acceptable,
        [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.components.mapRendering.panZoom.critical,
        cooldown: 15 * 60,
        destinations: DEFAULT_ALERT_DESTINATIONS,
      },
    },
    imageLoading: {
      heroImage: {
        [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.components.imageLoading.heroImage.acceptable,
        [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.components.imageLoading.heroImage.critical,
        cooldown: 15 * 60,
        destinations: DEFAULT_ALERT_DESTINATIONS,
      },
    },
  },
};

/**
 * Determine the alert severity based on a metric value
 * @param {string} category - The metric category (e.g., 'pageLoad', 'apiResponses')
 * @param {string} name - The specific metric name
 * @param {number} value - The measured value
 * @returns {string|null} - The alert severity or null if no threshold is exceeded
 */
export function getAlertSeverity(category, name, value) {
  if (!ALERTING_THRESHOLDS[category] || !ALERTING_THRESHOLDS[category][name]) {
    return null; // No configured thresholds for this metric
  }
  
  const thresholds = ALERTING_THRESHOLDS[category][name];
  
  // Handle CLS where lower is better
  if (category === 'pageLoad' && name === 'CLS') {
    if (value >= thresholds[ALERT_SEVERITY.CRITICAL]) return ALERT_SEVERITY.CRITICAL;
    if (value >= thresholds[ALERT_SEVERITY.ERROR]) return ALERT_SEVERITY.ERROR;
    if (value >= thresholds[ALERT_SEVERITY.WARNING]) return ALERT_SEVERITY.WARNING;
    return null;
  }
  
  // For normal metrics (where higher values are worse)
  if (thresholds[ALERT_SEVERITY.CRITICAL] && value >= thresholds[ALERT_SEVERITY.CRITICAL]) {
    return ALERT_SEVERITY.CRITICAL;
  }
  if (value >= thresholds[ALERT_SEVERITY.ERROR]) {
    return ALERT_SEVERITY.ERROR;
  }
  if (value >= thresholds[ALERT_SEVERITY.WARNING]) {
    return ALERT_SEVERITY.WARNING;
  }
  
  return null; // No threshold exceeded
}

/**
 * Get the notification channels for a given metric and severity
 * @param {string} category - The metric category
 * @param {string} name - The specific metric name
 * @param {string} severity - The alert severity
 * @returns {Array} - Array of notification channels
 */
export function getNotificationChannels(category, name, severity) {
  if (!ALERTING_THRESHOLDS[category] || 
      !ALERTING_THRESHOLDS[category][name] || 
      !ALERTING_THRESHOLDS[category][name].destinations ||
      !ALERTING_THRESHOLDS[category][name].destinations[severity]) {
    return DEFAULT_ALERT_DESTINATIONS[severity] || [NOTIFICATION_CHANNELS.CONSOLE];
  }
  
  return ALERTING_THRESHOLDS[category][name].destinations[severity];
}

export default ALERTING_THRESHOLDS;
