/**
 * Performance Alerting Thresholds Configuration
 *
 * This module centralises alert severity definitions, notification routing,
 * and the concrete metric thresholds derived from the performance budgets.
 */
import { PERFORMANCE_BUDGETS, type Budget } from './performance-budgets';

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

const requireBudget = (budget: Budget | undefined, context: string): Budget => {
  if (!budget) {
    throw new Error(`Missing performance budget for ${context}`);
  }
  return budget;
};

const PAGE_LOAD_FCP = requireBudget(PERFORMANCE_BUDGETS.pageLoad.FCP, 'pageLoad.FCP');
const PAGE_LOAD_LCP = requireBudget(PERFORMANCE_BUDGETS.pageLoad.LCP, 'pageLoad.LCP');
const PAGE_LOAD_TTI = requireBudget(PERFORMANCE_BUDGETS.pageLoad.TTI, 'pageLoad.TTI');
const PAGE_LOAD_FID = requireBudget(PERFORMANCE_BUDGETS.pageLoad.FID, 'pageLoad.FID');
const PAGE_LOAD_CLS = requireBudget(PERFORMANCE_BUDGETS.pageLoad.CLS, 'pageLoad.CLS');
const PAGE_LOAD_TBT = requireBudget(PERFORMANCE_BUDGETS.pageLoad.TBT, 'pageLoad.TBT');

const API_LISTINGS = requireBudget(PERFORMANCE_BUDGETS.apiResponses.listings, 'apiResponses.listings');
const API_SEARCH = requireBudget(PERFORMANCE_BUDGETS.apiResponses.search, 'apiResponses.search');
const API_MAP_DATA = requireBudget(PERFORMANCE_BUDGETS.apiResponses.mapData, 'apiResponses.mapData');
const API_USER_PROFILE = requireBudget(
  PERFORMANCE_BUDGETS.apiResponses.userProfile,
  'apiResponses.userProfile',
);

const SERVER_CPU = requireBudget(
  PERFORMANCE_BUDGETS.serverResources.cpuUtilization,
  'serverResources.cpuUtilization',
);
const SERVER_MEMORY = requireBudget(
  PERFORMANCE_BUDGETS.serverResources.memoryUtilization,
  'serverResources.memoryUtilization',
);
const SERVER_DISK = requireBudget(
  PERFORMANCE_BUDGETS.serverResources.diskIOUtilization,
  'serverResources.diskIOUtilization',
);

const COMPONENT_MAP_INITIAL_LOAD = requireBudget(
  PERFORMANCE_BUDGETS.components.mapRendering.initialLoad,
  'components.mapRendering.initialLoad',
);
const COMPONENT_MAP_PAN_ZOOM = requireBudget(
  PERFORMANCE_BUDGETS.components.mapRendering.panZoom,
  'components.mapRendering.panZoom',
);
const COMPONENT_HERO_IMAGE = requireBudget(
  PERFORMANCE_BUDGETS.components.imageLoading.heroImage,
  'components.imageLoading.heroImage',
);

export const ALERTING_THRESHOLDS: AlertingThresholds = {
  pageLoad: {
    FCP: {
      [ALERT_SEVERITY.WARNING]: PAGE_LOAD_FCP.acceptable,
      [ALERT_SEVERITY.ERROR]: PAGE_LOAD_FCP.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    LCP: {
      [ALERT_SEVERITY.WARNING]: PAGE_LOAD_LCP.acceptable,
      [ALERT_SEVERITY.ERROR]: PAGE_LOAD_LCP.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    TTI: {
      [ALERT_SEVERITY.WARNING]: PAGE_LOAD_TTI.acceptable,
      [ALERT_SEVERITY.ERROR]: PAGE_LOAD_TTI.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    FID: {
      [ALERT_SEVERITY.WARNING]: PAGE_LOAD_FID.acceptable,
      [ALERT_SEVERITY.ERROR]: PAGE_LOAD_FID.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    CLS: {
      [ALERT_SEVERITY.WARNING]: PAGE_LOAD_CLS.acceptable,
      [ALERT_SEVERITY.ERROR]: PAGE_LOAD_CLS.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    TBT: {
      [ALERT_SEVERITY.WARNING]: PAGE_LOAD_TBT.acceptable,
      [ALERT_SEVERITY.ERROR]: PAGE_LOAD_TBT.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
  },
  apiResponses: {
    listings: {
      [ALERT_SEVERITY.WARNING]: API_LISTINGS.acceptable,
      [ALERT_SEVERITY.ERROR]: API_LISTINGS.critical,
      [ALERT_SEVERITY.CRITICAL]: API_LISTINGS.critical * 1.5,
      cooldown: 5 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    search: {
      [ALERT_SEVERITY.WARNING]: API_SEARCH.acceptable,
      [ALERT_SEVERITY.ERROR]: API_SEARCH.critical,
      [ALERT_SEVERITY.CRITICAL]: API_SEARCH.critical * 1.5,
      cooldown: 5 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    mapData: {
      [ALERT_SEVERITY.WARNING]: API_MAP_DATA.acceptable,
      [ALERT_SEVERITY.ERROR]: API_MAP_DATA.critical,
      [ALERT_SEVERITY.CRITICAL]: API_MAP_DATA.critical * 1.5,
      cooldown: 5 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    userProfile: {
      [ALERT_SEVERITY.WARNING]: API_USER_PROFILE.acceptable,
      [ALERT_SEVERITY.ERROR]: API_USER_PROFILE.critical,
      [ALERT_SEVERITY.CRITICAL]: API_USER_PROFILE.critical * 1.5,
      cooldown: 5 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
  },
  serverResources: {
    cpuUtilization: {
      [ALERT_SEVERITY.WARNING]: SERVER_CPU.acceptable,
      [ALERT_SEVERITY.ERROR]: SERVER_CPU.critical,
      [ALERT_SEVERITY.CRITICAL]: 95,
      cooldown: 5 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    memoryUtilization: {
      [ALERT_SEVERITY.WARNING]: SERVER_MEMORY.acceptable,
      [ALERT_SEVERITY.ERROR]: SERVER_MEMORY.critical,
      [ALERT_SEVERITY.CRITICAL]: 95,
      cooldown: 5 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    diskIOUtilization: {
      [ALERT_SEVERITY.WARNING]: SERVER_DISK.acceptable,
      [ALERT_SEVERITY.ERROR]: SERVER_DISK.critical,
      cooldown: 10 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
  },
  components: {
    'mapRendering.initialLoad': {
      [ALERT_SEVERITY.WARNING]: COMPONENT_MAP_INITIAL_LOAD.acceptable,
      [ALERT_SEVERITY.ERROR]: COMPONENT_MAP_INITIAL_LOAD.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    'mapRendering.panZoom': {
      [ALERT_SEVERITY.WARNING]: COMPONENT_MAP_PAN_ZOOM.acceptable,
      [ALERT_SEVERITY.ERROR]: COMPONENT_MAP_PAN_ZOOM.critical,
      cooldown: 15 * 60,
      destinations: DEFAULT_ALERT_DESTINATIONS,
    },
    'imageLoading.heroImage': {
      [ALERT_SEVERITY.WARNING]: COMPONENT_HERO_IMAGE.acceptable,
      [ALERT_SEVERITY.ERROR]: COMPONENT_HERO_IMAGE.critical,
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
