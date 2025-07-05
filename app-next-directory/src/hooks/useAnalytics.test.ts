import { renderHook, act } from '@testing-library/react';
import { useAnalytics } from './useAnalytics';

// Mock analytics/config functions
jest.mock('@/lib/analytics/config', () => ({
  trackPageView: jest.fn(),
  trackEvent: jest.fn(),
  identifyUser: jest.fn(),
}));

// Mock next/navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

const { trackPageView, trackEvent, identifyUser } = require('@/lib/analytics/config');
const { usePathname, useSearchParams } = require('next/navigation');

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Provide a minimal mock for document and document.head.appendChild
    // @ts-ignore
    let _title = 'Test Title';
    let _referrer = 'https://referrer.com';
    global.document = Object.assign({}, global.document, {
      get title() {
        return _title;
      },
      set title(val) {
        _title = val;
      },
      get referrer() {
        return _referrer;
      },
      set referrer(val) {
        _referrer = val;
      },
      head: {
        appendChild: jest.fn()
      } as unknown as HTMLHeadElement,
      URL: '',
      alinkColor: '',
      all: [],
      anchors: [],
      applets: [],
      bgColor: '',
      body: {},
      characterSet: '',
      charset: '',
      compatMode: '',
      cookie: '',
      toString() {
        return '[object Document]';
      },
      valueOf() {
        return this;
      },
      // Patch: Return correct values for property access
      getElementsByTagName: (tag: string) => {
        if (tag === 'title') {
          return [{ textContent: _title }];
        }
        if (tag === 'head') {
          return [{
            appendChild: jest.fn()
          }];
        }
        return [];
      },
      // Patch: Provide default values for querySelector
      querySelector: (selector: string) => {
        if (selector === 'title') {
          return { textContent: _title };
        }
        if (selector === 'head') {
          return {
            appendChild: jest.fn()
          };
        }
        return null;
      },
      // Patch: Provide default values for document.title and document.referrer property access
      getElementsByName: (name: string) => {
        if (name === 'title') {
          return [{ textContent: _title }];
        }
        return [];
      },
      // Patch: Provide default values for document.referrer property access
      // Remove duplicate referrer accessor
    });
  });

  it('tracks page view on mount', () => {
    usePathname.mockReturnValue('/test-path');
    useSearchParams.mockReturnValue({
      toString: () => 'foo=bar'
    });

    renderHook(() => useAnalytics());

    expect(trackPageView).toHaveBeenCalledWith({
      title: '',
      path: '/test-path',
      search: '?foo=bar',
      referrer: ''
    });
  });

  it('tracks page view with no search params', () => {
    usePathname.mockReturnValue('/test-path');
    useSearchParams.mockReturnValue({
      toString: () => ''
    });

    // Ensure document.title is set for the test
    global.document.title = 'Test Title';

    renderHook(() => useAnalytics({ referrer: 'https://referrer.com' }));

    expect(trackPageView).toHaveBeenCalledWith({
      title: 'Test Title',
      path: '/test-path',
      search: undefined,
      referrer: 'https://referrer.com'
    });
  });

  it('calls track with correct event and properties', () => {
    usePathname.mockReturnValue('/test');
    useSearchParams.mockReturnValue({ toString: () => '' });

    const { result } = renderHook(() => useAnalytics());
    act(() => {
      result.current.track('listing_view', { listingId: '123', listingName: 'Test Listing', category: 'Test Category', city: 'Test City' });
    });

    expect(trackEvent).toHaveBeenCalledWith({
      name: 'listing_view',
      properties: { listingId: '123', listingName: 'Test Listing', category: 'Test Category', city: 'Test City' }
    });
  });

  it('calls trackCustomEvent with custom event', () => {
    usePathname.mockReturnValue('/test');
    useSearchParams.mockReturnValue({ toString: () => '' });

    const { result } = renderHook(() => useAnalytics());
    const customEvent = { name: 'custom_event', properties: { foo: 'bar' } };
    act(() => {
      result.current.trackCustomEvent(customEvent);
    });

    expect(trackEvent).toHaveBeenCalledWith(customEvent);
  });

  it('calls identify with userId and traits', () => {
    usePathname.mockReturnValue('/test');
    useSearchParams.mockReturnValue({ toString: () => '' });

    const { result } = renderHook(() => useAnalytics());
    act(() => {
      result.current.identify('user123', { role: 'admin' });
    });

    expect(identifyUser).toHaveBeenCalledWith('user123', { role: 'admin' });
  });

  it('calls identify with userId only', () => {
    usePathname.mockReturnValue('/test');
    useSearchParams.mockReturnValue({ toString: () => '' });

    const { result } = renderHook(() => useAnalytics());
    act(() => {
      result.current.identify('user456');
    });

    expect(identifyUser).toHaveBeenCalledWith('user456', undefined);
  });
});
