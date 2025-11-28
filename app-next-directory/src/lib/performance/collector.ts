/**
 * Performance Metrics Collector
 *
 * This module is responsible for collecting and reporting performance metrics
 * including Core Web Vitals, custom performance marks, and server timing data.
 *
 * @version 1.0.0
 * @date May 18, 2025
 */

import { structuredLogger } from '@/lib/logger';

// Type definitions for web-vitals (if package is not installed)
interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: PerformanceEntry[];
  id: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache';
}

type ReportCallback = (metric: Metric) => void;

// Declare plausible on window
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown> }) => void;
  }
}

type PlausibleClient = (event: string, options?: { props?: Record<string, unknown> }) => void;

type WindowLike = Record<string, unknown> | undefined;

const getGlobalScope = (): Record<string, unknown> | undefined => {
  return dependencies.global ?? (globalThis as unknown as Record<string, unknown>);
};

const getWindowScope = (): Record<string, unknown> | undefined => {
  return (dependencies.window as Record<string, unknown> | undefined) ?? getGlobalScope();
};

const getPerformanceApi = (): Performance | undefined => {
  const win = getWindowScope();
  const globalScope = getGlobalScope();
  return (
    (win?.performance as Performance | undefined) ??
    (globalScope?.performance as Performance | undefined)
  );
};

const getPerformanceObserverCtor = (): typeof PerformanceObserver | undefined => {
  const win = getWindowScope();
  const globalScope = getGlobalScope();
  const observer = (win?.PerformanceObserver ?? globalScope?.PerformanceObserver) as
    | typeof PerformanceObserver
    | undefined;
  return typeof observer === 'function' ? observer : undefined;
};

const getPlausibleClient = (): PlausibleClient | undefined => {
  const win = getWindowScope();
  const globalScope = getGlobalScope();
  const client = (win?.plausible ?? globalScope?.plausible) as PlausibleClient | undefined;
  return typeof client === 'function' ? client : undefined;
};

// Mock web-vitals functions if the package is not available
const onCLS = (callback: ReportCallback) => {
  callback({
    name: 'CLS',
    value: 0,
    rating: 'good',
    delta: 0,
    entries: [],
    id: 'mock-cls',
    navigationType: 'navigate',
  });
};

const onFCP = (callback: ReportCallback) => {
  callback({
    name: 'FCP',
    value: 0,
    rating: 'good',
    delta: 0,
    entries: [],
    id: 'mock-fcp',
    navigationType: 'navigate',
  });
};

const onFID = (callback: ReportCallback) => {
  callback({
    name: 'FID',
    value: 0,
    rating: 'good',
    delta: 0,
    entries: [],
    id: 'mock-fid',
    navigationType: 'navigate',
  });
};

const onINP = (callback: ReportCallback) => {
  callback({
    name: 'INP',
    value: 0,
    rating: 'good',
    delta: 0,
    entries: [],
    id: 'mock-inp',
    navigationType: 'navigate',
  });
};

const onLCP = (callback: ReportCallback) => {
  callback({
    name: 'LCP',
    value: 0,
    rating: 'good',
    delta: 0,
    entries: [],
    id: 'mock-lcp',
    navigationType: 'navigate',
  });
};

const onTTFB = (callback: ReportCallback) => {
  callback({
    name: 'TTFB',
    value: 0,
    rating: 'good',
    delta: 0,
    entries: [],
    id: 'mock-ttfb',
    navigationType: 'navigate',
  });
};

interface CollectorDependencies {
  window?: WindowLike;
  global?: Record<string, unknown>;
  onCLS: (callback: ReportCallback) => void;
  onFCP: (callback: ReportCallback) => void;
  onFID: (callback: ReportCallback) => void;
  onINP: (callback: ReportCallback) => void;
  onLCP: (callback: ReportCallback) => void;
  onTTFB: (callback: ReportCallback) => void;
}

export const dependencies: CollectorDependencies = {
  window: typeof window !== 'undefined' ? (window as unknown as WindowLike) : undefined,
  global:
    typeof globalThis !== 'undefined'
      ? (globalThis as unknown as Record<string, unknown>)
      : undefined,
  onCLS,
  onFCP,
  onFID,
  onINP,
  onLCP,
  onTTFB,
};

// Performance metric thresholds based on Core Web Vitals
export const PERFORMANCE_THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  FID: { good: 100, needsImprovement: 300 },
  INP: { good: 200, needsImprovement: 500 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
};

// Custom performance marks for tracking specific features
export const PERFORMANCE_MARKS = {
  MAP_INIT: 'map-initialization',
  MAP_MARKERS_LOADED: 'map-markers-loaded',
  SEARCH_STARTED: 'search-started',
  SEARCH_COMPLETED: 'search-completed',
  FILTERS_APPLIED: 'filters-applied',
  LISTING_LOADED: 'listing-loaded',
};

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold?: number;
}

/**
 * Converts raw metric value to a rating based on thresholds
 */
function getRating(name: string, value: number): PerformanceMetric['rating'] {
  const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Reports performance metric to Plausible Analytics
 */
function reportMetric({ name, value, rating }: PerformanceMetric) {
  if (process.env.NODE_ENV === 'development') {
    structuredLogger.info(`[Performance] ${name}: ${value.toFixed(2)} (${rating})`);
  }

  const plausible = getPlausibleClient();
  if (!plausible) return;

  plausible('performance', {
    props: {
      metric: name,
      value: Math.round(value),
      rating,
    },
  });
}

/**
 * Initializes performance monitoring
 * Call this function in your app's entry point
 */
export function initPerformanceMonitoring() {
  dependencies.onCLS((metric: Metric) => {
    reportMetric({
      name: 'CLS',
      value: metric.value,
      rating: getRating('CLS', metric.value),
    });
  });

  dependencies.onFCP((metric: Metric) => {
    reportMetric({
      name: 'FCP',
      value: metric.value,
      rating: getRating('FCP', metric.value),
    });
  });

  dependencies.onFID((metric: Metric) => {
    reportMetric({
      name: 'FID',
      value: metric.value,
      rating: getRating('FID', metric.value),
    });
  });

  dependencies.onINP((metric: Metric) => {
    reportMetric({
      name: 'INP',
      value: metric.value,
      rating: getRating('INP', metric.value),
    });
  });

  dependencies.onLCP((metric: Metric) => {
    reportMetric({
      name: 'LCP',
      value: metric.value,
      rating: getRating('LCP', metric.value),
    });
  });

  dependencies.onTTFB((metric: Metric) => {
    reportMetric({
      name: 'TTFB',
      value: metric.value,
      rating: getRating('TTFB', metric.value),
    });
  });

  const PerformanceObserverCtor = getPerformanceObserverCtor();
  if (PerformanceObserverCtor) {
    const perfObserver = new PerformanceObserverCtor(list => {
      list.getEntries().forEach(entry => {
        reportMetric({
          name: entry.name,
          value: entry.duration || entry.startTime,
          rating: 'good',
        });
      });
    });

    perfObserver.observe({ entryTypes: ['mark', 'measure'] });
  }
}

/**
 * Creates a performance mark with the given name
 */
export function markPerformance(markName: keyof typeof PERFORMANCE_MARKS) {
  const perf = getPerformanceApi();
  if (!perf || typeof perf.mark !== 'function') return;

  perf.mark(PERFORMANCE_MARKS[markName]);
}

/**
 * Measures time between two performance marks
 */
export function measurePerformance(
  measureName: string,
  startMark: keyof typeof PERFORMANCE_MARKS,
  endMark: keyof typeof PERFORMANCE_MARKS
) {
  const perf = getPerformanceApi();
  if (!perf || typeof perf.measure !== 'function') return;

  perf.measure(measureName, PERFORMANCE_MARKS[startMark], PERFORMANCE_MARKS[endMark]);
}
