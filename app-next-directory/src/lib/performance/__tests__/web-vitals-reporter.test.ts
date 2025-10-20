import { WebVitalsReporter } from '../web-vitals-reporter';

describe('WebVitalsReporter', () => {
	const originalNavigator = (global as any).navigator;
	const originalFetch = (global as any).fetch;

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
		const sendBeacon = jest.fn(() => true);
		Object.defineProperty(global, 'navigator', {
			configurable: true,
			value: { sendBeacon },
		});
		Object.defineProperty(global, 'fetch', {
			configurable: true,
			value: jest.fn(() => Promise.resolve({ ok: true })),
		});

		const metric = { id: '1', name: 'CLS', value: 1 } as any;
		WebVitalsReporter(metric);

		expect(sendBeacon).toHaveBeenCalledWith(
			'/api/performance/web-vitals',
			JSON.stringify({ ...metric, entries: [] })
		);
		expect((global as any).fetch).not.toHaveBeenCalled();
	});

	test('falls back to fetch when sendBeacon is unavailable', () => {
		Object.defineProperty(global, 'navigator', {
			configurable: true,
			value: {},
		});
		const fetchMock = jest.fn(() => Promise.resolve({ ok: true }));
		Object.defineProperty(global, 'fetch', {
			configurable: true,
			value: fetchMock,
		});

		const metric = { id: '2', name: 'LCP', value: 2 } as any;
		WebVitalsReporter(metric);

		expect(fetchMock).toHaveBeenCalled();
		const [url, opts] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/performance/web-vitals');
		expect(opts.method).toBe('POST');
	});
});
