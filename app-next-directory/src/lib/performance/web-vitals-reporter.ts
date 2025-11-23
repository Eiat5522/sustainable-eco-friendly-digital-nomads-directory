type WebVitalsMetric = {
  id: string;
  name: string;
  value: number;
  delta: number;
  entries: PerformanceEntry[];
};

export function reportWebVitals(metric: WebVitalsMetric) {
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', {
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
    });
  }

  // Send metrics to endpoint
  const url = '/api/performance/web-vitals';
  const body = JSON.stringify(metric);

  // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, {
      body,
      method: 'POST',
      keepalive: true,
    });
  }
}
