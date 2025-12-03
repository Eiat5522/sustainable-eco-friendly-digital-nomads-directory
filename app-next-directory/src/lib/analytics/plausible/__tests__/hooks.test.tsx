import { renderHook } from '@testing-library/react';
import { ANALYTICS_EVENTS } from '../config';
import { usePlausibleAnalytics } from '../hooks';

jest.mock('@/lib/logger');

describe('usePlausibleAnalytics', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  it('logs events in development mode', () => {
    process.env.NODE_ENV = 'development';

    const { result } = renderHook(() => usePlausibleAnalytics());

    result.current.trackListingEvent({ listingId: '1', action: 'view' });
    result.current.trackSearchEvent({ query: 'wifi', resultsCount: 3 });
    result.current.trackMapEvent({ action: 'zoom' });
    result.current.trackReviewSubmission('listing-1');
    result.current.trackFilterApplication({ price: 'budget' });

    expect(jest.requireMock<typeof import("@/lib/logger")>("@/lib/logger").structuredLogger.debug).toHaveBeenCalledWith('Analytics Event (noop)', {
      component: 'analytics',
      args: ['listing', '{"listingId":"1","action":"view"}'],
    });
    expect(jest.requireMock<typeof import("@/lib/logger")>("@/lib/logger").structuredLogger.debug).toHaveBeenCalledTimes(5);
  });

  it('is silent outside of development', () => {
    process.env.NODE_ENV = 'production';

    const { result } = renderHook(() => usePlausibleAnalytics());
    result.current.trackSearchEvent({ query: 'wifi', resultsCount: 1 });

    expect(jest.requireMock<typeof import("@/lib/logger")>("@/lib/logger").structuredLogger.debug).not.toHaveBeenCalled();
  });

  it('exposes event constants for consumers', () => {
    expect(ANALYTICS_EVENTS).toMatchObject({
      LISTING: 'listing_interaction',
      FILTER: 'filter_applied',
    });
  });
});
