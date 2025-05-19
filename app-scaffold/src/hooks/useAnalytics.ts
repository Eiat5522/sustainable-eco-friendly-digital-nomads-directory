import {
    type CustomEvent,
    type EventProperties,
    identifyUser,
    trackEvent,
    trackPageView
} from '@/lib/analytics/config';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect } from 'react';

export function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views automatically
  useEffect(() => {
    const search = searchParams?.toString();
    trackPageView({
      title: document.title,
      path: pathname,
      search: search ? `?${search}` : undefined,
      referrer: document.referrer
    });
  }, [pathname, searchParams]);

  // Typed event tracking
  const track = useCallback(<T extends keyof EventProperties>(
    eventName: T,
    properties: EventProperties[T]
  ) => {
    return trackEvent({
      name: eventName,
      properties
    });
  }, []);

  // Generic event tracking for events without predefined types
  const trackCustomEvent = useCallback((event: CustomEvent) => {
    return trackEvent(event);
  }, []);

  // User identification
  const identify = useCallback((
    userId: string,
    traits?: Record<string, any>
  ) => {
    return identifyUser(userId, traits);
  }, []);

  return {
    track,
    trackCustomEvent,
    identify
  };
}
