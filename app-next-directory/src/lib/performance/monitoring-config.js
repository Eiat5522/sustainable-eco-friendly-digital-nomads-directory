/**
 * Performance Monitoring Configuration
 * 
 * This file contains the configuration for performance monitoring tools
 * used in the Sustainable Eco-Friendly Digital Nomads Directory.
 * 
 * @version 1.0.0
 * @date May 15, 2025
 */

import { PERFORMANCE_BUDGETS } from './performance-budgets';

// Configuration for Web Vitals reporting
export const WEB_VITALS_CONFIG = {
  // Whether to report web vitals metrics
  enabled: true,
  
  // Endpoint to send metrics to (could be an analytics endpoint or custom API)
  reportingEndpoint: '/api/performance/web-vitals',
  
  // Sampling rate for metrics (1.0 = 100% of users, 0.1 = 10% of users)
  samplingRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Which metrics to track
  metrics: ['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP'],
  
  // Debug mode - log metrics to console
  debug: process.env.NODE_ENV === 'development',
  
  // Thresholds based on our performance budgets
  thresholds: {
    FCP: PERFORMANCE_BUDGETS.pageLoad.FCP.acceptable,
    LCP: PERFORMANCE_BUDGETS.pageLoad.LCP.acceptable,
    CLS: PERFORMANCE_BUDGETS.pageLoad.CLS.acceptable,
    FID: PERFORMANCE_BUDGETS.pageLoad.FID.acceptable,
    TTFB: 800, // Time to First Byte threshold
    INP: 200, // Interaction to Next Paint threshold
  },
};

// Configuration for Server Timing headers
export const SERVER_TIMING_CONFIG = {
  enabled: true,
  
  // Include detailed timing information in development
  verbose: process.env.NODE_ENV === 'development',
  
  // Which operations to include in the timing headers
  operations: [
    'database-query',
    'cms-fetch',
    'render-time',
    'api-response',
    'cache-operations',
  ],
};

// Configuration for API monitoring
export const API_MONITORING_CONFIG = {
  enabled: true,
  
  // Log slow API calls (based on thresholds)
  logSlowCalls: true,
  
  // Endpoints to track
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

// Configuration for Resource size monitoring
export const RESOURCE_SIZE_CONFIG = {
  enabled: true,
  
  // Monitor JS bundle sizes against budget
  monitorBundleSize: true,
  
  // Monitor image sizes against budget
  monitorImageSize: true,
  
  // Thresholds based on our performance budgets
  thresholds: {
    javascript: PERFORMANCE_BUDGETS.resourceSize.javascript.acceptable,
    css: PERFORMANCE_BUDGETS.resourceSize.css.acceptable,
    images: PERFORMANCE_BUDGETS.resourceSize.images.acceptable,
    fonts: PERFORMANCE_BUDGETS.resourceSize.fonts.acceptable,
    total: PERFORMANCE_BUDGETS.resourceSize.total.acceptable,
  },
};

// Export all configurations as a single object
export const MONITORING_CONFIG = {
  webVitals: WEB_VITALS_CONFIG,
  serverTiming: SERVER_TIMING_CONFIG,
  apiMonitoring: API_MONITORING_CONFIG,
  resourceSize: RESOURCE_SIZE_CONFIG,
};

export default MONITORING_CONFIG;
