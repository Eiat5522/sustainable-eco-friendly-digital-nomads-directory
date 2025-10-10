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

type PlausibleClient = (event: string, options?: { props?: Record<string, any> }) => void
type WindowLike = Partial<Window> & Record<string, unknown>

const getWindowLike = (): WindowLike | undefined => {
  if (typeof dependencies.window !== 'undefined') {
    return dependencies.window as WindowLike
  }

  if (typeof globalThis !== 'undefined') {
    const maybeWindow = (globalThis as Record<string, unknown>).window as WindowLike | undefined
    if (maybeWindow) return maybeWindow
  }

  if (typeof window !== 'undefined') {
    return window as unknown as WindowLike
  }

  return undefined
}

const resolvePlausible = (win = getWindowLike()): PlausibleClient | null => {
  const scope = (typeof globalThis !== 'undefined' ? globalThis : {}) as Record<string, unknown>

  if (win && typeof (win as { plausible?: unknown }).plausible === 'function') {
    return ((win as { plausible?: unknown }).plausible as PlausibleClient)
  }

  if (win && win !== scope) {
    return null
  }

  const fromGlobal = scope.plausible
  return typeof fromGlobal === 'function' ? (fromGlobal as PlausibleClient) : null
}

// Performance event categories in Plausible
export const PERFORMANCE_EVENTS = Object.freeze({
  WEB_VITALS: 'web_vitals',
  SERVER_TIMING: 'server_timing',
  RESOURCE_TIMING: 'resource_timing',
  CUSTOM_MARK: 'custom_mark',
  ALERT: 'performance_alert'
} as const)

interface PerformanceEvent {
  name: string
  value: number
  category: keyof typeof PERFORMANCE_EVENTS
  metadata?: Record<string, any>
}

// For testability, we inject dependencies.
// This is safe for production as it defaults to the real window object.
export const dependencies = {
  window: typeof window !== 'undefined' ? window : (undefined as (Window & typeof globalThis & { plausible?: any }) | undefined),
}


/**
 * Reports a performance event to Plausible Analytics
 */
export function reportPerformanceEvent(event: PerformanceEvent) {
  const win = getWindowLike()
  const plausible = resolvePlausible(win)

  if (!plausible) {
    if (!win) return

    console.warn('[Performance] Plausible Analytics not initialized')
    return
  }

  const baseProps = {
    metric: event.name,
    value: Math.round(event.value)
  }

  const props = event.metadata ? { ...baseProps, ...event.metadata } : baseProps
  const eventName = PERFORMANCE_EVENTS[event.category]

  // Send event to Plausible
  plausible(eventName, { props })

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
