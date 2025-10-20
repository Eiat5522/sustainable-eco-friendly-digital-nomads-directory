/**
 * Performance Monitoring Configuration
 *
 * Consolidates the configuration used by performance monitoring tools.
 */
import { PERFORMANCE_BUDGETS } from './performance-budgets';

export type WebVitalsConfig = {
  enabled: boolean;
  reportingEndpoint: string;
  samplingRate: number;
  metrics: string[];
  debug: boolean;
  thresholds: {
    FCP: number;
    LCP: number;
    CLS: number;
    FID: number;
    TTFB: number;
    INP: number;
  };
};

export type ServerTimingConfig = {
  enabled: boolean;
  verbose: boolean;
  operations: string[];
};

export type ApiMonitoringConfig = {
  enabled: boolean;
  logSlowCalls: boolean;
  endpoints: Record<
    string,
    {
      threshold: number;
    }
  >;
};

export type ResourceSizeConfig = {
  enabled: boolean;
  monitorBundleSize: boolean;
  monitorImageSize: boolean;
  thresholds: {
    javascript: number;
    css: number;
    images: number;
    fonts: number;
    total: number;
  };
};

export type MonitoringConfig = {
  webVitals: WebVitalsConfig;
  serverTiming: ServerTimingConfig;
  apiMonitoring: ApiMonitoringConfig;
  resourceSize: ResourceSizeConfig;
};

export const WEB_VITALS_CONFIG: WebVitalsConfig = {
  enabled: true,
  reportingEndpoint: '/api/performance/web-vitals',
  samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  metrics: ['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP'],
  debug: process.env.NODE_ENV === 'development',
  thresholds: {
    FCP: PERFORMANCE_BUDGETS.pageLoad.FCP.acceptable,
    LCP: PERFORMANCE_BUDGETS.pageLoad.LCP.acceptable,
    CLS: PERFORMANCE_BUDGETS.pageLoad.CLS.acceptable,
    FID: PERFORMANCE_BUDGETS.pageLoad.FID.acceptable,
    TTFB: 800,
    INP: 200,
  },
};

export const SERVER_TIMING_CONFIG: ServerTimingConfig = {
  enabled: true,
  verbose: process.env.NODE_ENV === 'development',
  operations: ['database-query', 'cms-fetch', 'render-time', 'api-response', 'cache-operations'],
};

export const API_MONITORING_CONFIG: ApiMonitoringConfig = {
  enabled: true,
  logSlowCalls: true,
  endpoints: {
    listings: {
      threshold: PERFORMANCE_BUDGETS.apiResponses.listings.acceptable,
    },
    search: {
      threshold: PERFORMANCE_BUDGETS.apiResponses.search.acceptable,
    },
    mapData: {
      threshold: PERFORMANCE_BUDGETS.apiResponses.mapData.acceptable,
    },
    userProfile: {
      threshold: PERFORMANCE_BUDGETS.apiResponses.userProfile.acceptable,
    },
  },
};

export const RESOURCE_SIZE_CONFIG: ResourceSizeConfig = {
  enabled: true,
  monitorBundleSize: true,
  monitorImageSize: true,
  thresholds: {
    javascript: PERFORMANCE_BUDGETS.resourceSize.javascript.acceptable,
    css: PERFORMANCE_BUDGETS.resourceSize.css.acceptable,
    images: PERFORMANCE_BUDGETS.resourceSize.images.acceptable,
    fonts: PERFORMANCE_BUDGETS.resourceSize.fonts.acceptable,
    total: PERFORMANCE_BUDGETS.resourceSize.total.acceptable,
  },
};

export const MONITORING_CONFIG: MonitoringConfig = {
  webVitals: WEB_VITALS_CONFIG,
  serverTiming: SERVER_TIMING_CONFIG,
  apiMonitoring: API_MONITORING_CONFIG,
  resourceSize: RESOURCE_SIZE_CONFIG,
};

export default MONITORING_CONFIG;
