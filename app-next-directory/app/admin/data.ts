import 'server-only';

import { cacheLife } from 'next/cache';
import { z } from 'zod';
import { fetchAdminAnalytics } from '@/lib/admin/analytics';

const AdminMonthPointSchema = z.object({
  month: z.string(),
  label: z.string(),
  usersCreated: z.number(),
  listingsCreated: z.number(),
  reviewsCreated: z.number(),
  pendingModeration: z.number(),
});

const AdminModerationEntrySchema = z.object({
  id: z.string(),
  itemType: z.string(),
  itemName: z.string(),
  itemId: z.string(),
  reports: z.number(),
  lastActivity: z.string(),
  status: z.string(),
});

const AdminAnalyticsSchema = z.object({
  overview: z.object({
    totalUsers: z.number(),
    totalListings: z.number(),
    totalReviews: z.number(),
    weeklySignups: z.number(),
    pendingModeration: z.number(),
  }),
  range: z.object({
    months: z.union([z.literal(3), z.literal(6), z.literal(12)]),
    from: z.string(),
    to: z.string(),
  }),
  monthly: z.array(AdminMonthPointSchema),
  userRoles: z.record(z.string(), z.number()),
  listingStatusBreakdown: z.object({
    published: z.number(),
    unpublished: z.number(),
    pending: z.number(),
    draft: z.number(),
    featured: z.number(),
  }),
  moderationQueue: z.array(AdminModerationEntrySchema),
  generatedAt: z.string(),
});

const AdminAnalyticsResponseSchema = z.object({
  analytics: AdminAnalyticsSchema,
});

export type AdminDashboardData = z.infer<typeof AdminAnalyticsSchema>;

function normalizeMonths(months: number) {
  return months === 6 || months === 12 ? months : 3;
}

export async function getAdminDashboardData(months = 3): Promise<AdminDashboardData> {
  'use cache: private';
  cacheLife({ stale: 30, expire: 120 });

  const analytics = await fetchAdminAnalytics({
    months: normalizeMonths(months),
  });
  const parsed = AdminAnalyticsResponseSchema.safeParse({ analytics });

  if (!parsed.success) {
    throw new Error('Invalid admin analytics response payload');
  }

  return parsed.data.analytics;
}
