import 'server-only';

import { cacheLife } from 'next/cache';
import { z } from 'zod';
import { getBaseUrl } from '@/lib/absolute-url';
import { getCookieHeader } from '@/lib/server/cookies';
import type {
  ListingManagementItem,
  ListingManagementResponse,
  ListingWorkflowStatus,
} from '@/types/listings';
import type { ListingStats } from './types';

const ListingWorkflowStatusSchema = z.enum(['published', 'unpublished', 'pending', 'draft']);
const ListingTypeSchema = z.enum([
  'coworking',
  'cafe',
  'accommodation',
  'restaurant',
  'activities',
  'unknown',
]);
const ListingModerationStateSchema = z.enum(['pending', 'approved', 'rejected']);

const ListingManagementItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: ListingTypeSchema,
  status: ListingWorkflowStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
  city: z.string().nullable(),
  moderationStatus: ListingModerationStateSchema.nullable(),
  isFeatured: z.boolean(),
});

const ListingManagementPaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalCount: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

const ListingManagementFiltersSchema = z.object({
  search: z.string(),
  status: ListingWorkflowStatusSchema.nullable(),
  type: ListingTypeSchema.nullable(),
});

const ListingManagementResponseSchema = z.object({
  listings: z.array(ListingManagementItemSchema),
  pagination: ListingManagementPaginationSchema,
  filters: ListingManagementFiltersSchema,
});

type AdminListingsParams = {
  page?: number;
  search?: string;
  status?: ListingWorkflowStatus | null;
  type?: ListingManagementItem['type'] | null;
};

export async function getAdminListings(
  params: AdminListingsParams = {}
): Promise<ListingManagementResponse> {
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

  if (params.status) {
    searchParams.set('status', params.status);
  }

  if (params.type) {
    searchParams.set('type', params.type);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const cookieHeader = await getCookieHeader();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/admin/listings?${searchParams.toString()}`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      typeof errorBody?.error === 'string' ? errorBody.error : 'Failed to fetch listings';
    throw new Error(message);
  }

  const parsedBody = await response.json();
  const parsed = ListingManagementResponseSchema.safeParse(parsedBody);
  if (!parsed.success) {
    throw new Error('Invalid admin listings response payload');
  }
  return parsed.data;
}

const ListingStatsSchema = z.object({
  totalListings: z.number(),
  publishedListings: z.number(),
  unpublishedListings: z.number(),
  pendingListings: z.number(),
  draftListings: z.number(),
  featuredListings: z.number(),
  listingsByType: z.record(z.number()),
});

export async function getAdminListingStats(): Promise<ListingStats> {
  'use cache: private';
  cacheLife({ stale: 30, expire: 120 });

  const baseUrl = await getBaseUrl();
  const cookieHeader = await getCookieHeader();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/admin/listings/stats`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out while fetching listing statistics');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      typeof errorBody?.error === 'string' ? errorBody.error : 'Failed to fetch listing statistics';
    throw new Error(message);
  }

  const parsedBody = await response.json();
  const parsed = ListingStatsSchema.safeParse(parsedBody);
  if (!parsed.success) {
    throw new Error('Invalid listing stats response payload');
  }
  return parsed.data;
}
