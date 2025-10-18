export const WebVitalsReporter = (metric) => {
  const metricPayload = {
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
    try {
      const sendBeaconResult = navigator.sendBeacon(url, body);
      if (sendBeaconResult) {
        return;
      }
    } catch (error) {
      // Intentionally fall through to the fetch fallback if sendBeacon throws.
    }
  }

  if (typeof fetch !== 'undefined') {
    fetch(url, { method: 'POST', body, keepalive: true }).catch(() => {});
  }
};

export const reportWebVitals = WebVitalsReporter;

export function measureFunctionTime(fn, name = 'Function') {
  const now = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();
  const start = now();
  const result = fn();
  const end = now();
  const executionTime = end - start;

  if (process.env.NODE_ENV === 'development') {
    const formattedExecutionTime =
      typeof executionTime?.toFixed === 'function' ? executionTime.toFixed(2) : executionTime;
    console.debug(`[${name}] Execution time: ${formattedExecutionTime}ms`);
  }

  return result;
}

export const recordMetric = (name, value, details = {}) => {
  if (process.env.NODE_ENV === 'test') return;
  // placeholder for sampling logic (disabled by default)
  if (Math.random() > 1) return;

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Custom Metric] ${name}: ${value}`, details);
  }

  try {
    const body = JSON.stringify({ name, value, details, timestamp: Date.now() });
    if (typeof fetch !== 'undefined') {
      fetch('/api/performance/custom', { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  } catch (error) {
    // ignore errors when metrics cannot be reported
  }
};

export default WebVitalsReporter;
