/**
 * Performance Alerting Thresholds Configuration
 *
 * This module centralises alert severity definitions, notification routing,
 * and the concrete metric thresholds derived from the performance budgets.
 */
import { PERFORMANCE_BUDGETS } from './performance-budgets';

export const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export type AlertSeverity = (typeof ALERT_SEVERITY)[keyof typeof ALERT_SEVERITY];

export const NOTIFICATION_CHANNELS = {
  CONSOLE: 'console',
  EMAIL: 'email',
  SLACK: 'slack',
  WEBHOOK: 'webhook',
} as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

export type DestinationMap = Partial<Record<AlertSeverity, NotificationChannel[]>>;

const DEFAULT_ALERT_DESTINATIONS: DestinationMap = {
  [ALERT_SEVERITY.INFO]: [NOTIFICATION_CHANNELS.CONSOLE],
  [ALERT_SEVERITY.WARNING]: [NOTIFICATION_CHANNELS.CONSOLE, NOTIFICATION_CHANNELS.SLACK],
  [ALERT_SEVERITY.ERROR]: [
    NOTIFICATION_CHANNELS.CONSOLE,
    NOTIFICATION_CHANNELS.SLACK,
    NOTIFICATION_CHANNELS.EMAIL,
  ],
  [ALERT_SEVERITY.CRITICAL]: [
    NOTIFICATION_CHANNELS.CONSOLE,
    NOTIFICATION_CHANNELS.SLACK,
    NOTIFICATION_CHANNELS.EMAIL,
  ],
};

export const ALERT_DESTINATION_CONFIG = {
  [NOTIFICATION_CHANNELS.EMAIL]: {
    recipients: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') ?? ['admin@sustainablenomads.com'],
    from: process.env.ALERT_EMAIL_FROM ?? 'alerts@sustainablenomads.com',
  },
  [NOTIFICATION_CHANNELS.SLACK]: {
    webhook: process.env.ALERT_SLACK_WEBHOOK,
    channel: process.env.ALERT_SLACK_CHANNEL ?? '#performance-alerts',
  },
  [NOTIFICATION_CHANNELS.WEBHOOK]: {
    url: process.env.ALERT_WEBHOOK_URL,
    method: 'POST',
  },
} as const;

export type AlertDestinationConfig = typeof ALERT_DESTINATION_CONFIG;

export type AlertThresholdEntry = Partial<Record<AlertSeverity, number>> & {
  cooldown?: number;
  destinations?: DestinationMap;
};

export type AlertingThresholds = Record<string, Record<string, AlertThresholdEntry>>;

export const ALERTING_THRESHOLDS: AlertingThresholds = {
  pageLoad: {
    FCP: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.pageLoad.FCP.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.pageLoad.FCP.critical,
      cooldown: 15 * 60,
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
  apiResponses: {
    listings: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.apiResponses.listings.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.apiResponses.listings.critical,
      [ALERT_SEVERITY.CRITICAL]: PERFORMANCE_BUDGETS.apiResponses.listings.critical * 1.5,
      cooldown: 5 * 60,
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
  serverResources: {
    cpuUtilization: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.serverResources.cpuUtilization.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.serverResources.cpuUtilization.critical,
      [ALERT_SEVERITY.CRITICAL]: 95,
      cooldown: 5 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    memoryUtilization: {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.serverResources.memoryUtilization.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.serverResources.memoryUtilization.critical,
      [ALERT_SEVERITY.CRITICAL]: 95,
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
  components: {
    'mapRendering.initialLoad': {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.components.mapRendering.initialLoad.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.components.mapRendering.initialLoad.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    'mapRendering.panZoom': {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.components.mapRendering.panZoom.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.components.mapRendering.panZoom.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    'imageLoading.heroImage': {
      [ALERT_SEVERITY.WARNING]: PERFORMANCE_BUDGETS.components.imageLoading.heroImage.acceptable,
      [ALERT_SEVERITY.ERROR]: PERFORMANCE_BUDGETS.components.imageLoading.heroImage.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
  },
};

export function getAlertSeverity(category: string, name: string, value: number): AlertSeverity | null {
  const thresholds = ALERTING_THRESHOLDS[category]?.[name];
  if (!thresholds) {
    return null;
  }

  if (category === 'pageLoad' && name === 'CLS') {
    const criticalThreshold = thresholds[ALERT_SEVERITY.CRITICAL];
    if (criticalThreshold !== undefined && value >= criticalThreshold) {
      return ALERT_SEVERITY.CRITICAL;
    }
    const errorThreshold = thresholds[ALERT_SEVERITY.ERROR];
    if (errorThreshold !== undefined && value >= errorThreshold) {
      return ALERT_SEVERITY.ERROR;
    }
    const warningThreshold = thresholds[ALERT_SEVERITY.WARNING];
    if (warningThreshold !== undefined && value >= warningThreshold) {
      return ALERT_SEVERITY.WARNING;
    }
    return null;
  }

  const criticalThreshold = thresholds[ALERT_SEVERITY.CRITICAL];
  if (criticalThreshold !== undefined && value >= criticalThreshold) {
    return ALERT_SEVERITY.CRITICAL;
  }

  const errorThreshold = thresholds[ALERT_SEVERITY.ERROR];
  if (errorThreshold !== undefined && value >= errorThreshold) {
    return ALERT_SEVERITY.ERROR;
  }

  const warningThreshold = thresholds[ALERT_SEVERITY.WARNING];
  if (warningThreshold !== undefined && value >= warningThreshold) {
    return ALERT_SEVERITY.WARNING;
  }

  return null;
}

export function getNotificationChannels(
  category: string,
  name: string,
  severity: AlertSeverity
): NotificationChannel[] {
  const destinations = ALERTING_THRESHOLDS[category]?.[name]?.destinations;
  if (!destinations || !destinations[severity]) {
    return DEFAULT_ALERT_DESTINATIONS[severity] ?? [NOTIFICATION_CHANNELS.CONSOLE];
  }

  return destinations[severity] ?? [NOTIFICATION_CHANNELS.CONSOLE];
}

export default ALERTING_THRESHOLDS;
