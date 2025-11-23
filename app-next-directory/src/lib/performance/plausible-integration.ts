/**
 * Performance Monitoring Integration with Plausible Analytics
 *
 * This module connects our performance monitoring system with
 * Plausible Analytics for centralized reporting and analysis.
 *
 * @version 1.0.0
 * @date May 18, 2025
 */

import { shouldAlert, type PerformanceAlert } from './budgets'

// Performance event categories in Plausible
export const PERFORMANCE_EVENTS = {
  WEB_VITALS: 'web_vitals',
  SERVER_TIMING: 'server_timing',
  RESOURCE_TIMING: 'resource_timing',
  CUSTOM_MARK: 'custom_mark',
  ALERT: 'performance_alert'
} as const

interface PerformanceEvent {
  name: string
  value: number
  category: keyof typeof PERFORMANCE_EVENTS
  metadata?: Record<string, any>
}

/**
 * Reports a performance event to Plausible Analytics
 */
export function reportPerformanceEvent(event: PerformanceEvent) {
  if (typeof window === 'undefined') return

  const plausible = window.plausible
  if (!plausible) {
    console.warn('[Performance] Plausible Analytics not initialized')
    return
  }

  // Send event to Plausible
  plausible(PERFORMANCE_EVENTS[event.category], {
    props: {
      metric: event.name,
      value: Math.round(event.value),
      ...event.metadata
    }
  })

  // Check if this event should trigger an alert
  let alert: PerformanceAlert | null = null

  switch (event.category) {
    case 'WEB_VITALS':
      alert = shouldAlert(event.name, event.value, 'webVitals')
      break
    case 'RESOURCE_TIMING':
      alert = shouldAlert(event.name, event.value, 'resources')
      break
    case 'SERVER_TIMING':
      alert = shouldAlert(event.name, event.value, 'api')
      break
    case 'CUSTOM_MARK':
      alert = shouldAlert(event.name, event.value, 'features')
      break
  }

  // If alert is triggered, send it to Plausible
  if (alert) {
    plausible(PERFORMANCE_EVENTS.ALERT, {
      props: {
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        severity: alert.severity
      }
    })
  }
}

/**
 * Hook to track performance metrics in components
 */
export function usePerformanceTracking() {
  return {
    trackPerformance: (event: Omit<PerformanceEvent, 'category'>) => {
      reportPerformanceEvent({
        ...event,
        category: 'CUSTOM_MARK'
      })
    }
  }
}
