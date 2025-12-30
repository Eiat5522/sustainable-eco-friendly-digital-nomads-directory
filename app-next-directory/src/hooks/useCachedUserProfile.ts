'use client';

import { useEffect, useMemo, useState } from 'react';
import { getUserDisplayInfo, type UserDisplaySource } from '@/lib/user-display';

type CachedProfileResponse = {
  data?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
};

export function useCachedUserProfile(
  sessionUser: UserDisplaySource | null | undefined,
  enabled: boolean,
  fallback = 'Your account'
) {
  const [cachedUser, setCachedUser] = useState<UserDisplaySource | null>(null);

  useEffect(() => {
    if (!enabled || process.env.NODE_ENV === 'test' || typeof fetch !== 'function') {
      return;
    }

    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/user/profile', { signal: controller.signal });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as CachedProfileResponse;
        if (payload?.data?.name || payload?.data?.email) {
          setCachedUser({
            name: payload.data.name ?? null,
            email: payload.data.email ?? null,
          });
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    };

    void loadProfile();

    return () => {
      controller.abort();
    };
  }, [enabled]);

  const displayInfo = useMemo(
    () => getUserDisplayInfo(cachedUser ?? sessionUser ?? null, fallback),
    [cachedUser, fallback, sessionUser]
  );

  return {
    cachedUser,
    displayInfo,
  };
}
