import { renderHook } from '@testing-library/react';
import { ANALYTICS_EVENTS } from '../config';
import { usePlausibleAnalytics } from '../hooks';

describe('usePlausibleAnalytics', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  it('logs events in development mode', () => {
    process.env.NODE_ENV = 'development';
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const { result } = renderHook(() => usePlausibleAnalytics());

    result.current.trackListingEvent({ listingId: '1', action: 'view' });
    result.current.trackSearchEvent({ query: 'wifi', resultsCount: 3 });
    result.current.trackMapEvent({ action: 'zoom' });
    result.current.trackReviewSubmission('listing-1');
    result.current.trackFilterApplication({ price: 'budget' });

    expect(logSpy).toHaveBeenCalledWith('Analytics Event:', 'listing', {
      listingId: '1',
      action: 'view',
    });
    expect(logSpy).toHaveBeenCalledTimes(5);

    logSpy.mockRestore();
  });

  it('is silent outside of development', () => {
    process.env.NODE_ENV = 'production';
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const { result } = renderHook(() => usePlausibleAnalytics());
    result.current.trackSearchEvent({ query: 'wifi', resultsCount: 1 });

    expect(logSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });

  it('exposes event constants for consumers', () => {
    expect(ANALYTICS_EVENTS).toMatchObject({
      LISTING: 'listing_interaction',
      FILTER: 'filter_applied',
    });
  });
});
