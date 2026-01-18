import 'server-only';

import { cacheLife } from 'next/cache';
import { getBaseUrl } from '@/lib/absolute-url';
import { getCookieHeader } from '@/lib/server/cookies';
import type { UserRole } from '@/types/auth';
import type { UsersResponse } from './types';
import { z } from 'zod';

const UsersResponseSchema = z.object({
  users: z.array(z.object({
    id: z.string(),
    // ... add other fields based on UserListItem type
  })),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

type AdminUsersParams = {
  page?: number;
  search?: string;
  role?: UserRole | null;
};

export async function getAdminUsers(params: AdminUsersParams = {}): Promise<UsersResponse> {
  'use cache: private';
  cacheLife({ stale: 30, expire: 120 });

  const baseUrl = await getBaseUrl();
  const searchParams = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: '20',
  });

  if (params.search) {
    searchParams.set('search', params.search);
  }

  if (params.role) {
    searchParams.set('role', params.role);
  }

  const cookieHeader = await getCookieHeader();
  const response = await fetch(`${baseUrl}/api/admin/users?${searchParams.toString()}`, {
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      typeof errorBody?.error === 'string' ? errorBody.error : 'Failed to fetch users';
    throw new Error(message);
  }

  const parsedBody = await response.json();
  const parsed = UsersResponseSchema.safeParse(parsedBody);
  if (!parsed.success) {
    throw new Error('Invalid admin users response payload');
  }
  return parsed.data;
}
