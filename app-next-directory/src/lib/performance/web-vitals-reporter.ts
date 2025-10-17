export type WebVitalsMetric = {
  id: string;
  name: string;
  value: number;
  delta?: number;
  entries?: PerformanceEntry[];
};

export const reportWebVitals = (metric: WebVitalsMetric) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug('Web Vitals:', metric.name, metric.value, metric.delta);
  }

  const url = '/api/performance/web-vitals';
  const body = JSON.stringify(metric);

  if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    try {
      // Call sendBeacon via a safe cast to avoid compiler errors while still guarding at runtime
      const n = navigator as unknown as { sendBeacon?: (u: string, data: string) => boolean };
      n.sendBeacon?.(url, body);
    } catch {
      // fallback
      if (typeof fetch !== 'undefined') fetch(url, { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  } else if (typeof fetch !== 'undefined') {
    fetch(url, { method: 'POST', body, keepalive: true }).catch(() => {});
  }
};

export function measureFunctionTime<T>(fn: () => T, name = 'Function'): T {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const result = fn();
  const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const executionTime = end - start;
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[${name}] Execution time: ${executionTime.toFixed?.(2) ?? executionTime}ms`);
  }
  return result;
}

export const recordMetric = (name: string, value: number, details: Record<string, unknown> = {}): void => {
  if (process.env.NODE_ENV === 'test') return;
  // placeholder for sampling logic (disabled by default)
  if (Math.random() > 1) return;
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Custom Metric] ${name}: ${value}`, details);
  }
  try {
    const body = JSON.stringify({ name, value, details, timestamp: Date.now() });
    if (typeof fetch !== 'undefined') fetch('/api/performance/custom', { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch {
    // ignore
  }
};

export default reportWebVitals;
