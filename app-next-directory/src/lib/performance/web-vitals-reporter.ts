export type WebVitalsMetric = {
  id: string;
  name: string;
  value: number;
  delta?: number;
  entries?: PerformanceEntry[];
};

export const WebVitalsReporter = (metric: WebVitalsMetric) => {
  const metricPayload: WebVitalsMetric & { entries: PerformanceEntry[] } = {
    ...metric,
    entries: Array.isArray(metric.entries) ? metric.entries : [],
  };

  if (process.env.NODE_ENV === 'development') {
  }

  const url = '/api/performance/web-vitals';
  const body = JSON.stringify(metricPayload);
  const hasNavigator = typeof navigator !== 'undefined';
  const canUseSendBeacon = hasNavigator && typeof navigator.sendBeacon === 'function';

  if (canUseSendBeacon) {
    try {
      const sendBeaconResult = navigator.sendBeacon(url, body);
      if (sendBeaconResult) {
        return;
      }
    } catch {
      // Intentionally fall through to the fetch fallback if sendBeacon throws.
    }
  }

  if (typeof fetch !== 'undefined') {
    fetch(url, { method: 'POST', body, keepalive: true }).catch(() => {});
  }
};

export const reportWebVitals = WebVitalsReporter;

export function measureFunctionTime<T>(fn: () => T, _name = 'Function'): T {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const result = fn();
  const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const _executionTime = end - start;
  if (process.env.NODE_ENV === 'development') {
  }
  return result;
}

export const recordMetric = (
  name: string,
  value: number,
  details: Record<string, unknown> = {}
): void => {
  if (process.env.NODE_ENV === 'test') return;
  // placeholder for sampling logic (disabled by default)
  if (Math.random() > 1) return;
  if (process.env.NODE_ENV === 'development') {
  }
  try {
    const body = JSON.stringify({ name, value, details, timestamp: Date.now() });
    if (typeof fetch !== 'undefined')
      fetch('/api/performance/custom', { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch {
    // ignore
  }
};

export default WebVitalsReporter;
