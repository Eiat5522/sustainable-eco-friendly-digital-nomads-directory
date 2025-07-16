type WebVitalsMetric = {
  id: string;
  name: string;
  value: number;
  delta: number;
  entries: PerformanceEntry[];
};

export const WebVitalsReporter = (metric: WebVitalsMetric) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', {
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
    });
  }

  const url = '/api/performance/web-vitals';
  const body = JSON.stringify(metric);

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, {
      body,
      method: 'POST',
      keepalive: true,
    });
  }
};

export type { WebVitalsMetric };

export default WebVitalsReporter;
