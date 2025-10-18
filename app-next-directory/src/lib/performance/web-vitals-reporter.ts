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
    console.log('Web Vitals:', {
      name: metricPayload.name,
      value: metricPayload.value,
      delta: metricPayload.delta,
    });
  }

  const url = '/api/performance/web-vitals';
  const body = JSON.stringify(metricPayload);
  const hasNavigator = typeof navigator !== 'undefined';
  const canUseSendBeacon = hasNavigator && typeof navigator.sendBeacon === 'function';

  if (canUseSendBeacon) {
  if (canUseSendBeacon) {
    if (navigator.sendBeacon(url, body)) {
      return;
    }
  }
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

  const start = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
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

export default WebVitalsReporter;
