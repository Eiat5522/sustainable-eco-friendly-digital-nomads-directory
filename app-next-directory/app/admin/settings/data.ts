import 'server-only';

import { cacheLife } from 'next/cache';
import { getBaseUrl } from '@/lib/absolute-url';
import { getCookieHeader } from '@/lib/server/cookies';
import type { AdminSettingsResponse } from '@/types/admin-settings';
import type { SettingsFormData } from './types';

export async function getAdminSettings(): Promise<SettingsFormData> {
  'use cache: private';
  cacheLife({ stale: 30, expire: 120 });

  const baseUrl = await getBaseUrl();
  const controller = new AbortController();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const cookieHeader = await getCookieHeader();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/admin/settings`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      typeof errorBody?.error === 'string' ? errorBody.error : 'Failed to fetch settings';
    throw new Error(message);
  }

  const data = (await response.json()) as AdminSettingsResponse;
  const {
    _id: ignoredId,
    _type: ignoredType,
    _createdAt: ignoredCreatedAt,
    _updatedAt: ignoredUpdatedAt,
    ...formData
  } = data.settings;

  return formData;
}
