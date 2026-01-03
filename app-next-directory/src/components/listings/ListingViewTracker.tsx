'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

type ListingViewTrackerProps = {
  slug: string;
};

// Module-level set to track views across the session to prevent over-counting
const recordedSlugs = new Set<string>();

export function ListingViewTracker({ slug }: ListingViewTrackerProps): null {
  const pathname = usePathname();

  useEffect(() => {
    // Deduplication check: if we've already recorded this slug in this session, skip
    if (recordedSlugs.has(slug)) {
      return;
    }

    const controller = new AbortController();
    // Create a timer that calls controller.abort() after a short interval (5s)
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const recordView = async () => {
      if (!slug) return;
      if (!pathname || !pathname.startsWith('/listings/')) return;
      if (process.env.NODE_ENV === 'test' || typeof process.env.JEST_WORKER_ID !== 'undefined') {
        return;
      }

      try {
        const response = await fetch(`/api/listings/${slug}/views`, {
          method: 'POST',
          signal: controller.signal,
        });

        // Only mark the slug as recorded after a successful response
        if (response.ok) {
          recordedSlugs.add(slug);
        }
      } catch (_error) {
        // Ignore view tracking failures for end users
      }
    };

    recordView();

    // Ensure both the timeout and controller are cleaned up on effect cleanup
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [pathname, slug]);

  return null;
}
