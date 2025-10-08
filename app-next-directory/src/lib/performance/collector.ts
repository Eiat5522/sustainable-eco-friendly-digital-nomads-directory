/**
 * Performance Metrics Collector
 *
 * This module is responsible for collecting and reporting performance metrics
 * including Core Web Vitals, custom performance marks, and server timing data.
 *
 * @version 1.0.0
 * @date May 18, 2025
 */

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
    plausible?: (event: string, options?: { props?: Record<string, any> }) => void;
  }
}

// Mock web-vitals functions if the package is not available
const onCLS = (callback: ReportCallback) => {
  // Mock implementation - would need actual web-vitals package for real functionality
  console.warn('web-vitals package not installed - onCLS is mocked');
};

const onFCP = (callback: ReportCallback) => {
  console.warn('web-vitals package not installed - onFCP is mocked');
};

const onFID = (callback: ReportCallback) => {
  console.warn('web-vitals package not installed - onFID is mocked');
};

const onINP = (callback: ReportCallback) => {
  console.warn('web-vitals package not installed - onINP is mocked');
};

const onLCP = (callback: ReportCallback) => {
  console.warn('web-vitals package not installed - onLCP is mocked');
};

const onTTFB = (callback: ReportCallback) => {
  console.warn('web-vitals package not installed - onTTFB is mocked');
};

// Performance metric thresholds based on Core Web Vitals
export const PERFORMANCE_THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  FID: { good: 100, needsImprovement: 300 },
  INP: { good: 200, needsImprovement: 500 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 }
}

// Custom performance marks for tracking specific features
export const PERFORMANCE_MARKS = {
  MAP_INIT: 'map-initialization',
  MAP_MARKERS_LOADED: 'map-markers-loaded',
  SEARCH_STARTED: 'search-started',
  SEARCH_COMPLETED: 'search-completed',
  FILTERS_APPLIED: 'filters-applied',
  LISTING_LOADED: 'listing-loaded'
}

interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  threshold?: number
}

/**
 * Converts raw metric value to a rating based on thresholds
 */
function getRating(name: string, value: number): PerformanceMetric['rating'] {
  const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.needsImprovement) return 'needs-improvement'
  return 'poor'
}

/**
 * Reports performance metric to Plausible Analytics
 */
function reportMetric({ name, value, rating }: PerformanceMetric) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${value} (${rating})`)
  }

  // Report to Plausible as custom event
  const plausible = window.plausible
  if (plausible) {
    plausible('performance', {
      props: {
        metric: name,
        value: Math.round(value),
        rating
      }
    })
  }
}

/**
 * Initializes performance monitoring
 * Call this function in your app's entry point
 */
export function initPerformanceMonitoring() {
  // Monitor Core Web Vitals
  onCLS((metric: Metric) => {
    reportMetric({
      name: 'CLS',
      value: metric.value,
      rating: getRating('CLS', metric.value)
    })
  })

  onFCP((metric: Metric) => {
    reportMetric({
      name: 'FCP',
      value: metric.value,
      rating: getRating('FCP', metric.value)
    })
  })

  onFID((metric: Metric) => {
    reportMetric({
      name: 'FID',
      value: metric.value,
      rating: getRating('FID', metric.value)
    })
  })

  onINP((metric: Metric) => {
    reportMetric({
      name: 'INP',
      value: metric.value,
      rating: getRating('INP', metric.value)
    })
  })

  onLCP((metric: Metric) => {
    reportMetric({
      name: 'LCP',
      value: metric.value,
      rating: getRating('LCP', metric.value)
    })
  })

  onTTFB((metric: Metric) => {
    reportMetric({
      name: 'TTFB',
      value: metric.value,
      rating: getRating('TTFB', metric.value)
    })
  })

  // Initialize Performance Observer for custom marks
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    const perfObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        reportMetric({
          name: entry.name,
          value: entry.duration || entry.startTime,
          rating: 'good' // Custom marks don't have predefined thresholds
        })
      })
    })

    perfObserver.observe({ entryTypes: ['mark', 'measure'] })
  }
}

/**
 * Creates a performance mark with the given name
 */
export function markPerformance(markName: keyof typeof PERFORMANCE_MARKS) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(PERFORMANCE_MARKS[markName])
  }
}

/**
 * Measures time between two performance marks
 */
export function measurePerformance(
  measureName: string,
  startMark: keyof typeof PERFORMANCE_MARKS,
  endMark: keyof typeof PERFORMANCE_MARKS
) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.measure(
      measureName,
      PERFORMANCE_MARKS[startMark],
      PERFORMANCE_MARKS[endMark]
    )
  }
}
