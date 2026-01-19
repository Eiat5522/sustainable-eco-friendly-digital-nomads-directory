import 'server-only';

import { cacheLife } from 'next/cache';
import { z } from 'zod';
import { getBaseUrl } from '@/lib/absolute-url';
import { getCookieHeader } from '@/lib/server/cookies';
import type { UserRole } from '@/types/auth';
import type { UsersResponse } from './types';

const UsersResponseSchema = z.object({
  users: z.array(
    z.object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string(),
      role: z.enum(['user', 'editor', 'venueOwner', 'admin', 'superAdmin']),
      status: z.enum(['active', 'inactive', 'suspended', 'pending']),
      createdAt: z.string(),
      lastActiveAt: z.string().nullable(),
    })
  ),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
  filters: z.object({
    search: z.string().nullable(),
    role: z.enum(['user', 'editor', 'venueOwner', 'admin', 'superAdmin']).nullable(),
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
    headers: cookieHeader ? { cookie: cookieHeader } : {},
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
  // Admin UI only supports active/inactive toggles; treat suspended/pending as inactive.
  const normalized: UsersResponse = {
    ...parsed.data,
    users: parsed.data.users.map(user => ({
      ...user,
      status: user.status === 'active' ? 'active' : 'inactive',
    })),
  };
  return normalized;
}
