import * as moduleExports from '../index';

describe('plausible index exports', () => {
  it('re-exports configuration symbols and hooks', () => {
    expect(moduleExports.ANALYTICS_EVENTS).toBeDefined();
    expect(typeof moduleExports.usePlausibleAnalytics).toBe('function');
    expect(moduleExports.PlausibleAnalyticsProvider).toBeDefined();
  });
});
