import { WebVitalsReporter, type WebVitalsMetric } from '../web-vitals-reporter';

describe('WebVitalsReporter (fixed)', () => {
  const originalNavigator = globalThis.navigator;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: originalFetch,
    });
    jest.resetAllMocks();
  });

  test('uses navigator.sendBeacon when available and returns true', () => {
    const sendBeacon = jest.fn<(url: string, data?: BodyInit | null) => boolean>(() => true);
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: { sendBeacon },
    });
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: jest.fn(() => Promise.resolve({ ok: true })),
    });

    const metric = { id: '1', name: 'CLS', value: 1 } satisfies WebVitalsMetric;
    WebVitalsReporter(metric);

    expect(sendBeacon).toHaveBeenCalledWith(
      '/api/performance/web-vitals',
      JSON.stringify({ ...metric, entries: [] })
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test('falls back to fetch when sendBeacon exists but returns false', () => {
    const sendBeacon = jest.fn<(url: string, data?: BodyInit | null) => boolean>(() => false);
    Object.defineProperty(global, 'navigator', {
      configurable: true,
      value: { sendBeacon },
    });
    const fetchMock = jest.fn(() => Promise.resolve({ ok: true }));
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchMock,
    });

    const metric = { id: '2', name: 'LCP', value: 2 } satisfies WebVitalsMetric;
    WebVitalsReporter(metric);

    expect(sendBeacon).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalled();
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/performance/web-vitals');
    expect(opts.method).toBe('POST');
  });
});
