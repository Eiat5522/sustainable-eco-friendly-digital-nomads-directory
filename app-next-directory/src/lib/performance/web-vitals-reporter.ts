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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, entries: _entries, ...logMetric } = metricPayload;
    console.log('Web Vitals:', logMetric);
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
    const formatted =
      typeof _executionTime.toFixed === 'function'
        ? _executionTime.toFixed(2)
        : `${_executionTime}`;
    console.debug(`[${_name}] Execution time: ${formatted}ms`);
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
    console.debug(`[Custom Metric] ${name}: ${value}`, details);
  }
  try {
    const body = JSON.stringify({ name, value, details, timestamp: Date.now() });
    if (typeof fetch !== 'undefined')
      fetch('/api/performance/custom', { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[Custom Metric] Failed to record metric:', error);
    }
  }
};

export default WebVitalsReporter;
