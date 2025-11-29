const analyticsInstance = {
  page: jest.fn().mockResolvedValue(undefined),
  track: jest.fn().mockResolvedValue(undefined),
  identify: jest.fn().mockResolvedValue(undefined),
};

const analyticsFactory = jest.fn(() => analyticsInstance);
const googleAnalyticsPlugin = jest.fn(() => ({ name: 'ga' }));
const posthogInit = jest.fn();
const posthogDebug = jest.fn();

jest.mock(
  'analytics',
  () => ({
    __esModule: true,
    default: analyticsFactory,
  }),
  { virtual: true }
);

jest.mock(
  '@analytics/google-analytics',
  () => ({
    __esModule: true,
    default: googleAnalyticsPlugin,
  }),
  { virtual: true }
);

jest.mock('@vercel/analytics/react', () => ({
  Analytics: jest.fn(() => null),
}));

jest.mock('posthog-js', () => ({
  __esModule: true,
  default: { init: posthogInit, debug: posthogDebug },
  init: posthogInit,
  debug: posthogDebug,
}));

describe('analytics config helpers', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('exposes configuration values and track helpers', async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'GA-123';
    process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID = 'VERCEL-123';
    process.env.NEXT_PUBLIC_POSTHOG_TOKEN = 'token';
    process.env.NODE_ENV = 'production';

    let trackPageView: any;
    let trackEvent: any;
    let identifyUser: any;
    let ANALYTICS_CONFIG: any;

    jest.isolateModules(() => {
      const mod = require('../config');
      trackPageView = mod.trackPageView;
      trackEvent = mod.trackEvent;
      identifyUser = mod.identifyUser;
      ANALYTICS_CONFIG = mod.ANALYTICS_CONFIG;
    });

    await trackPageView({ title: 'Home', path: '/home', referrer: 'ref', search: '?q=1' });
    expect(analyticsInstance.page).toHaveBeenCalledWith({
      title: 'Home',
      path: '/home',
      referrer: 'ref',
      search: '?q=1',
    });

    await trackEvent({ name: 'click', properties: { id: 1 } });
    expect(analyticsInstance.track).toHaveBeenCalledWith('click', { id: 1 });

    await identifyUser('user-1', { role: 'admin' });
    expect(analyticsInstance.identify).toHaveBeenCalledWith('user-1', { role: 'admin' });

    expect(ANALYTICS_CONFIG).toMatchObject({
      GA_MEASUREMENT_ID: 'GA-123',
      VERCEL_ANALYTICS_ID: 'VERCEL-123',
      POSTHOG_TOKEN: 'token',
      IS_PRODUCTION: true,
    });

    expect(posthogInit).toHaveBeenCalledWith('token', {
      api_host: 'https://app.posthog.com',
      loaded: expect.any(Function),
    });
  });

  it('handles failures from analytics helpers gracefully', async () => {
    analyticsInstance.page.mockRejectedValueOnce(new Error('page-error'));
    analyticsInstance.track.mockRejectedValueOnce(new Error('track-error'));
    analyticsInstance.identify.mockRejectedValueOnce(new Error('identify-error'));

    let trackPageView: any;
    let trackEvent: any;
    let identifyUser: any;

    jest.isolateModules(() => {
      const mod = require('../config');
      trackPageView = mod.trackPageView;
      trackEvent = mod.trackEvent;
      identifyUser = mod.identifyUser;
    });

    // The functions silently catch errors, so they should not throw
    await expect(trackPageView({ title: 'Error', path: '/error' })).resolves.not.toThrow();
    await expect(trackEvent({ name: 'oops' })).resolves.not.toThrow();
    await expect(identifyUser('user-2')).resolves.not.toThrow();
  });

  it('enables posthog debug in development mode', () => {
    process.env.NEXT_PUBLIC_POSTHOG_TOKEN = 'token';
    process.env.NODE_ENV = 'development';

    jest.isolateModules(() => {
      require('../config');
    });

    const [, initOptions] = posthogInit.mock.calls[0];
    initOptions.loaded({ debug: posthogDebug });

    expect(posthogDebug).toHaveBeenCalled();
  });
});
