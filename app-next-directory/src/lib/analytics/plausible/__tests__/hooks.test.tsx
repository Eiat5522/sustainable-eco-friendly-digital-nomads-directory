import { renderHook } from '@testing-library/react';
import { ANALYTICS_EVENTS } from '../config';
import { usePlausibleAnalytics } from '../hooks';

describe('usePlausibleAnalytics', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  it('provides tracking functions that can be called', () => {
    const { result } = renderHook(() => usePlausibleAnalytics());

    // These should not throw
    expect(() => result.current.trackListingEvent({ listingId: '1', action: 'view' })).not.toThrow();
    expect(() => result.current.trackSearchEvent({ query: 'wifi', resultsCount: 3 })).not.toThrow();
    expect(() => result.current.trackMapEvent({ action: 'zoom' })).not.toThrow();
    expect(() => result.current.trackReviewSubmission('listing-1')).not.toThrow();
    expect(() => result.current.trackFilterApplication({ price: 'budget' })).not.toThrow();
  });

  it('provides tracking functions in production', () => {
    process.env.NODE_ENV = 'production';

    const { result } = renderHook(() => usePlausibleAnalytics());
    expect(() => result.current.trackSearchEvent({ query: 'wifi', resultsCount: 1 })).not.toThrow();
  });

  it('exposes event constants for consumers', () => {
    expect(ANALYTICS_EVENTS).toMatchObject({
      LISTING: 'listing_interaction',
      FILTER: 'filter_applied',
    });
  });
});
