import 'server-only';
import { updateTag } from 'next/cache';
import { getRoleCounts } from '@/lib/auth/dal';
import { getDefaultTimeout, withRequestTimeout } from '@/lib/http/request';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';
import { ROLE_VALUES } from '@/models/User';

export const ADMIN_MONTH_WINDOWS = [3, 6, 12] as const;

export type AdminModerationEntry = {
  id: string;
  itemType: string;
  itemName: string;
  itemId: string;
  reports: number;
  lastActivity: string;
  status: string;
};

type ModerationReport = {
  _key?: string;
  reportedBy?: {
    _ref?: string;
  };
  reason?: string;
  details?: string;
};

type ModerationStatusDocument = {
  _id: string;
  _createdAt: string;
  status?: string;
  userReports?: ModerationReport[] | null;
};

type RoleKey = (typeof ROLE_VALUES)[number];

export type AdminRoleCounts = Record<RoleKey, number>;

export const createEmptyRoleCounts = (): AdminRoleCounts =>
  Object.fromEntries(
    (ROLE_VALUES as readonly string[]).map(role => [role, 0] as const)
  ) as AdminRoleCounts;

export type AdminAnalyticsMonthPoint = {
  month: string;
  label: string;
  usersCreated: number;
  listingsCreated: number;
  reviewsCreated: number;
  pendingModeration: number;
};

export type AdminListingStatusBreakdown = {
  published: number;
  unpublished: number;
  pending: number;
  draft: number;
  featured: number;
};

export type AdminAnalyticsSnapshot = {
  overview: {
    totalUsers: number;
    totalListings: number;
    totalReviews: number;
    weeklySignups: number;
    pendingModeration: number;
  };
  range: {
    months: (typeof ADMIN_MONTH_WINDOWS)[number];
    from: string;
    to: string;
  };
  monthly: AdminAnalyticsMonthPoint[];
  userRoles: AdminRoleCounts;
  listingStatusBreakdown: AdminListingStatusBreakdown;
  moderationQueue: AdminModerationEntry[];
  generatedAt: string;
};

type AdminAnalyticsTuple = [
  number,
  number,
  number,
  number,
  AdminModerationEntry[],
  AdminRoleCounts,
  AdminListingStatusBreakdown,
];

type MonthlyDoc = { _createdAt?: string | null };

type MonthBucket = {
  key: string;
  label: string;
  start: Date;
  end: Date;
};

const monthLabelFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

async function safeAdminSanityFetch<T>(
  fetcher: () => Promise<T | null | undefined>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    const result = await withRequestTimeout(
      fetcher(),
      getDefaultTimeout(),
      `Admin analytics Sanity request timed out: ${context}`
    );

    return result ?? fallback;
  } catch (error) {
    structuredLogger.warn(`[admin/analytics] ${context} failed`, error, {
      context,
    });
    return fallback;
  }
}

function clampAdminMonthWindow(months: number | null | undefined): (typeof ADMIN_MONTH_WINDOWS)[number] {
  if (months === 6 || months === 12) {
    return months;
  }

  return 3;
}

export function normalizeAdminMonthWindow(monthsParam: string | null): (typeof ADMIN_MONTH_WINDOWS)[number] {
  if (!monthsParam) return 3;

  const parsed = Number.parseInt(monthsParam, 10);
  if (Number.isNaN(parsed)) return 3;

  return clampAdminMonthWindow(parsed);
}

export function createAdminMonthBuckets(monthCount: number, referenceDate: Date): MonthBucket[] {
  const safeMonthCount = clampAdminMonthWindow(monthCount);
  const buckets: MonthBucket[] = [];
  const base = new Date(
    Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1)
  );

  for (let offset = safeMonthCount - 1; offset >= 0; offset -= 1) {
    const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - offset, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));

    buckets.push({
      key: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, '0')}`,
      label: monthLabelFormatter.format(start),
      start,
      end,
    });
  }

  return buckets;
}

function countDocsInRange(docs: MonthlyDoc[], start: Date, end: Date): number {
  return docs.reduce((count, doc) => {
    if (!doc?._createdAt) {
      return count;
    }

    const createdAt = new Date(doc._createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      return count;
    }

    return createdAt >= start && createdAt < end ? count + 1 : count;
  }, 0);
}

async function fetchMonthlyAnalyticsData(rangeStart: string): Promise<{
  users: MonthlyDoc[];
  listings: MonthlyDoc[];
  reviews: MonthlyDoc[];
  moderation: MonthlyDoc[];
}> {
  const [users, listings, reviews, moderation] = await Promise.all([
    safeAdminSanityFetch(
      () =>
        client.fetch<MonthlyDoc[]>('*[_type == "user" && _createdAt >= $rangeStart]{ _createdAt }', {
          rangeStart,
        }) as Promise<MonthlyDoc[]>,
      [],
      'fetching monthly users'
    ),
    safeAdminSanityFetch(
      () =>
        client.fetch<MonthlyDoc[]>('*[_type == "listing" && _createdAt >= $rangeStart]{ _createdAt }', {
          rangeStart,
        }) as Promise<MonthlyDoc[]>,
      [],
      'fetching monthly listings'
    ),
    safeAdminSanityFetch(
      () =>
        client.fetch<MonthlyDoc[]>('*[_type == "review" && _createdAt >= $rangeStart]{ _createdAt }', {
          rangeStart,
        }) as Promise<MonthlyDoc[]>,
      [],
      'fetching monthly reviews'
    ),
    safeAdminSanityFetch(
      () =>
        client.fetch<MonthlyDoc[]>(
          '*[_type == "moderationStatus" && status == "pending" && _createdAt >= $rangeStart]{ _createdAt }',
          { rangeStart }
        ) as Promise<MonthlyDoc[]>,
      [],
      'fetching monthly moderation queue'
    ),
  ]);

  return {
    users: users ?? [],
    listings: listings ?? [],
    reviews: reviews ?? [],
    moderation: moderation ?? [],
  };
}

async function fetchListingStatusBreakdown(): Promise<AdminListingStatusBreakdown> {
  const [published, unpublished, pending, draft, featured] = await Promise.all([
    safeAdminSanityFetch(
      () =>
        client.fetch<number>(
          'count(*[_type == "listing" && coalesce(adminWorkflow.status, moderation.status, "draft") == "published"])'
        ) as Promise<number>,
      0,
      'fetching published listing count'
    ),
    safeAdminSanityFetch(
      () =>
        client.fetch<number>(
          'count(*[_type == "listing" && coalesce(adminWorkflow.status, moderation.status, "draft") == "unpublished"])'
        ) as Promise<number>,
      0,
      'fetching unpublished listing count'
    ),
    safeAdminSanityFetch(
      () =>
        client.fetch<number>(
          'count(*[_type == "listing" && coalesce(adminWorkflow.status, moderation.status, "draft") == "pending"])'
        ) as Promise<number>,
      0,
      'fetching pending listing count'
    ),
    safeAdminSanityFetch(
      () =>
        client.fetch<number>(
          'count(*[_type == "listing" && coalesce(adminWorkflow.status, moderation.status, "draft") == "draft"])'
        ) as Promise<number>,
      0,
      'fetching draft listing count'
    ),
    safeAdminSanityFetch(
      () =>
        client.fetch<number>(
          'count(*[_type == "listing" && coalesce(adminWorkflow.isFeatured, moderation.featured, false) == true && coalesce(adminWorkflow.status, moderation.status, "draft") == "published"])'
        ) as Promise<number>,
      0,
      'fetching featured listing count'
    ),
  ]);

  return {
    published: published ?? 0,
    unpublished: unpublished ?? 0,
    pending: pending ?? 0,
    draft: draft ?? 0,
    featured: featured ?? 0,
  };
}

async function fetchRoleCounts(): Promise<AdminRoleCounts> {
  // Use MongoDB as the single source of truth for role counts
  try {
    const counts = await withRequestTimeout<Record<string, number>>(
      getRoleCounts(),
      getDefaultTimeout(),
      'Fetching admin role counts timed out'
    );
    const baseCounts = createEmptyRoleCounts();
    Object.keys(counts).forEach(k => {
      if (k in baseCounts) {
        (baseCounts as Record<string, number>)[k] = counts[k] ?? 0;
      }
    });
    return baseCounts;
  } catch (err) {
    structuredLogger.warn('[admin/analytics] fetchRoleCounts failed', err);
    return createEmptyRoleCounts();
  }
}

type ModerationQueueProjection = Pick<ModerationStatusDocument, '_id' | '_createdAt' | 'status'> & {
  itemType?: string;
  itemName?: string;
  itemId?: string;
  userReports?: ModerationReport[] | null;
};

const MODERATION_QUEUE_PROJECTION = `
  _id,
  _createdAt,
  status,
  "itemType": item->._type,
  "itemName": coalesce(item->.name, item->.title, "Unnamed Item"),
  "itemId": item->._id,
  userReports
`;

function isModerationReport(value: unknown): value is ModerationReport {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const report = value as Partial<ModerationReport>;
  return typeof report._key === 'string';
}

function normalizeReportCount(reports: ModerationQueueProjection['userReports']): number {
  if (!Array.isArray(reports)) {
    return 0;
  }

  return reports.filter(isModerationReport).length;
}

const mapModerationProjectionToEntry = (item: ModerationQueueProjection): AdminModerationEntry => ({
  id: item._id,
  itemType: item.itemType ?? 'unknown',
  itemName: item.itemName ?? 'Unnamed Item',
  itemId: item.itemId ?? 'unknown',
  reports: normalizeReportCount(item.userReports),
  lastActivity: item._createdAt,
  status: item.status ?? 'pending',
});

async function fetchModerationEntryById(id: string): Promise<AdminModerationEntry | null> {
  const result = await client.fetch<ModerationQueueProjection | ModerationQueueProjection[] | null>(
    `*[_type == "moderationStatus" && _id == $id][0] {${MODERATION_QUEUE_PROJECTION}}`,
    { id }
  );
  const projection = Array.isArray(result) ? result[0] : result;
  return projection ? mapModerationProjectionToEntry(projection) : null;
}

export async function fetchModerationQueue(limit = 10): Promise<AdminModerationEntry[]> {
  const queue = await safeAdminSanityFetch(
    () =>
      client.fetch<ModerationQueueProjection[]>(
        `*[_type == "moderationStatus" && status == "pending"] | order(_createdAt desc)[0...$limit] {${MODERATION_QUEUE_PROJECTION}}`,
        { limit }
      ) as Promise<ModerationQueueProjection[]>,
    [],
    'fetching moderation queue'
  );

  return queue.map(mapModerationProjectionToEntry);
}

export async function fetchAdminAnalytics(options: {
  months?: (typeof ADMIN_MONTH_WINDOWS)[number];
} = {}): Promise<AdminAnalyticsSnapshot> {
  const referenceDate = new Date();
  const months = clampAdminMonthWindow(options.months);
  const buckets = createAdminMonthBuckets(months, referenceDate);
  const rangeStart = buckets[0]?.start ?? referenceDate;

  const [
    userCount,
    listingCount,
    reviewCount,
    pendingModerationCount,
    moderationQueue,
    roleCounts,
    listingStatusBreakdown,
  ] = await withRequestTimeout<AdminAnalyticsTuple>(
    Promise.all([
      safeAdminSanityFetch(
        () => client.fetch<number>('count(*[_type == "user"])') as Promise<number>,
        0,
        'fetching total users'
      ),
      safeAdminSanityFetch(
        () => client.fetch<number>('count(*[_type == "listing"])') as Promise<number>,
        0,
        'fetching total listings'
      ),
      safeAdminSanityFetch(
        () => client.fetch<number>('count(*[_type == "review"])') as Promise<number>,
        0,
        'fetching total reviews'
      ),
      safeAdminSanityFetch(
        () =>
          client.fetch<number>(
            'count(*[_type == "moderationStatus" && status == "pending"])'
          ) as Promise<number>,
        0,
        'fetching pending moderation total'
      ),
      fetchModerationQueue(),
      fetchRoleCounts(),
      fetchListingStatusBreakdown(),
    ]) as Promise<AdminAnalyticsTuple>,
    getDefaultTimeout(),
    'Fetching admin analytics summary timed out'
  );

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklySignups = await safeAdminSanityFetch(
    () =>
      client.fetch<number>('count(*[_type == "user" && _createdAt >= $sevenDaysAgo])', {
        sevenDaysAgo: sevenDaysAgo.toISOString(),
      }) as Promise<number>,
    0,
    'fetching weekly signups'
  );

  const monthlySource = await withRequestTimeout(
    fetchMonthlyAnalyticsData(rangeStart.toISOString()),
    getDefaultTimeout(),
    'Fetching admin monthly analytics timed out'
  );

  const monthly = buckets.map(bucket => ({
    month: bucket.key,
    label: bucket.label,
    usersCreated: countDocsInRange(monthlySource.users, bucket.start, bucket.end),
    listingsCreated: countDocsInRange(monthlySource.listings, bucket.start, bucket.end),
    reviewsCreated: countDocsInRange(monthlySource.reviews, bucket.start, bucket.end),
    pendingModeration: countDocsInRange(monthlySource.moderation, bucket.start, bucket.end),
  }));

  return {
    overview: {
      totalUsers: userCount ?? 0,
      totalListings: listingCount ?? 0,
      totalReviews: reviewCount ?? 0,
      weeklySignups: weeklySignups ?? 0,
      pendingModeration: pendingModerationCount ?? 0,
    },
    range: {
      months,
      from: rangeStart.toISOString(),
      to: referenceDate.toISOString(),
    },
    monthly,
    userRoles: roleCounts,
    listingStatusBreakdown,
    moderationQueue,
    generatedAt: referenceDate.toISOString(),
  };
}

export type ModerationAction = 'approve' | 'restrict' | 'dismiss' | 'flag' | 'saveNote';

const MODERATION_STATUS_MAP: Record<Exclude<ModerationAction, 'saveNote'>, string> = {
  approve: 'approved',
  restrict: 'restricted',
  dismiss: 'resolved',
  flag: 'flagged',
};

type ModerationActionInput = {
  moderationId: string;
  actorId: string;
  action: ModerationAction;
  notes?: string;
};

export type ModerationHistoryEntry = {
  action: ModerationAction;
  actor: string;
  notes: string | null;
  at: string;
};

const createEmptyModerationHistory = (): { moderationHistory: ModerationHistoryEntry[] } => ({
  moderationHistory: [],
});

const createModerationHistoryEntry = (
  action: ModerationAction,
  actorId: string,
  notes: string | undefined,
  timestamp: string
): ModerationHistoryEntry => ({
  action,
  actor: actorId,
  notes: notes ?? null,
  at: timestamp,
});

export async function performModerationAction({
  moderationId,
  actorId,
  action,
  notes,
}: ModerationActionInput): Promise<AdminModerationEntry | null> {
  const status = action === 'saveNote' ? null : MODERATION_STATUS_MAP[action];
  if (status === undefined && action !== 'saveNote') {
    throw new Error(`Unsupported moderation action: ${action}`);
  }

  const timestamp = new Date().toISOString();
  const patch = client.patch!(moderationId)
    .set(status ? { status, lastActionAt: timestamp } : { lastActionAt: timestamp })
    .setIfMissing(createEmptyModerationHistory())
    .append('moderationHistory', [createModerationHistoryEntry(action, actorId, notes, timestamp)]);

  if (notes) {
    patch.set({ resolutionNotes: notes });
  }

  await patch.commit({ autoGenerateArrayKeys: true });

  try {
    updateTag('moderation');
  } catch {}

  return fetchModerationEntryById(moderationId);
}

export type BulkOperationType = 'publishListings' | 'unpublishListings' | 'featureListings';

type HighResolutionTimeFn = () => number;

const now: HighResolutionTimeFn = () => {
  const performanceNow = globalThis?.performance?.now;
  if (typeof performanceNow === 'function') {
    return performanceNow.call(globalThis.performance);
  }
  return Date.now();
};

const dedupeIds = (ids: string[]): string[] => {
  const unique = new Set<string>();
  for (const id of ids) {
    if (typeof id === 'string' && id.trim().length > 0) {
      unique.add(id);
    }
  }
  return Array.from(unique);
};

type IdChunk = string[];

const chunkIds = (ids: string[], size: number): IdChunk[] => {
  if (size <= 0) {
    return [ids];
  }

  const chunks: IdChunk[] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
};

export const BULK_OPERATION_BATCH_SIZE = 50;
export const BULK_OPERATION_MAX_CONCURRENCY = 3;

type BulkOperationFailureReason = 'commitFailed';

export type BulkOperationFailure = {
  id: string;
  reason: BulkOperationFailureReason;
  errorMessage?: string;
};

type BulkBatchResult = {
  succeeded: string[];
  failed: BulkOperationFailure[];
};

type PatchFactory = (timestamp: string) => ListingWorkflowPatch;

const commitBatch = async (
  batchIds: string[],
  patchFactory: PatchFactory,
  timestamp: string,
  batchIndex: number,
  totalBatches: number,
  operation: BulkOperationType
): Promise<BulkBatchResult> => {
  const transaction = client.transaction!();

  for (const id of batchIds) {
    transaction.patch(id, (patch: { set: (value: unknown) => unknown }) =>
      patch.set(patchFactory(timestamp))
    );
  }

  const batchStart = now();

  try {
    await withRequestTimeout(
      transaction.commit({ autoGenerateArrayKeys: true }) as Promise<unknown>,
      getDefaultTimeout(),
      'Committing admin bulk operation batch timed out'
    );
    structuredLogger.performance('admin.bulk.batch', now() - batchStart, {
      operation,
      batchSize: batchIds.length,
      batchIndex,
      totalBatches,
    });
    return { succeeded: [...batchIds], failed: [] };
  } catch (error) {
    structuredLogger.error('Admin bulk operation batch failed', error, {
      component: 'admin-bulk-operations',
      operation,
      batchSize: batchIds.length,
      batchIndex,
      totalBatches,
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      succeeded: [],
      failed: batchIds.map(id => ({ id, reason: 'commitFailed', errorMessage })),
    };
  }
};

type BulkProcessingSummary = {
  succeeded: number;
  failed: BulkOperationFailure[];
  concurrency: number;
};

const processBatches = async (
  batches: IdChunk[],
  patchFactory: PatchFactory,
  timestamp: string,
  operation: BulkOperationType
): Promise<BulkProcessingSummary> => {
  const totalBatches = batches.length;
  if (totalBatches === 0) {
    return { succeeded: 0, failed: [], concurrency: 0 };
  }

  const failed: BulkOperationFailure[] = [];
  let succeeded = 0;
  const concurrency = Math.min(BULK_OPERATION_MAX_CONCURRENCY, totalBatches);
  let pointer = 0;

  const worker = async () => {
    while (true) {
      const currentIndex = pointer;
      pointer += 1;
      if (currentIndex >= totalBatches) {
        break;
      }

      const batchIds = batches[currentIndex];
      if (!batchIds) {
        continue;
      }
      const result = await commitBatch(
        batchIds,
        patchFactory,
        timestamp,
        currentIndex,
        totalBatches,
        operation
      );

      if (result.succeeded.length) {
        succeeded += result.succeeded.length;
      }
      if (result.failed.length) {
        failed.push(...result.failed);
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return { succeeded, failed, concurrency };
};

type PublishWorkflowPatch = {
  'adminWorkflow.status': 'published' | 'unpublished';
  'adminWorkflow.lastChangedAt': string;
};

type FeatureWorkflowPatch = {
  'adminWorkflow.isFeatured': boolean;
  'adminWorkflow.lastChangedAt': string;
};

export type ListingWorkflowPatch = PublishWorkflowPatch | FeatureWorkflowPatch;

const BULK_OPERATION_PATCH: Record<BulkOperationType, (timestamp: string) => ListingWorkflowPatch> =
  {
    publishListings: timestamp => ({
      'adminWorkflow.status': 'published',
      'adminWorkflow.lastChangedAt': timestamp,
    }),
    unpublishListings: timestamp => ({
      'adminWorkflow.status': 'unpublished',
      'adminWorkflow.lastChangedAt': timestamp,
    }),
    featureListings: timestamp => ({
      'adminWorkflow.isFeatured': true,
      'adminWorkflow.lastChangedAt': timestamp,
    }),
  };

type BulkOperationResult = {
  operation: BulkOperationType;
  total: number;
  succeeded: number;
  failed: BulkOperationFailure[];
};

type BulkOperationInput = {
  operation: BulkOperationType;
  ids: string[];
};

export async function runBulkOperation({
  operation,
  ids,
}: BulkOperationInput): Promise<BulkOperationResult> {
  const uniqueIds = dedupeIds(ids);
  if (!uniqueIds.length) {
    return { operation, total: 0, succeeded: 0, failed: [] };
  }

  const patchDataFactory = BULK_OPERATION_PATCH[operation];
  if (!patchDataFactory) {
    throw new Error(`Unsupported bulk operation: ${operation}`);
  }

  if (uniqueIds.length !== ids.length) {
    structuredLogger.info('Deduplicated ids for bulk operation', {
      component: 'admin-bulk-operations',
      operation,
      requested: ids.length,
      unique: uniqueIds.length,
    });
  }

  const start = now();
  const timestamp = new Date().toISOString();

  const batches = chunkIds(uniqueIds, BULK_OPERATION_BATCH_SIZE);
  const { succeeded, failed, concurrency } = await processBatches(
    batches,
    patchDataFactory,
    timestamp,
    operation
  );

  const duration = now() - start;
  structuredLogger.performance(`admin.bulk.${operation}`, duration, {
    component: 'admin-bulk-operations',
    operation,
    batches: batches.length,
    totalIds: uniqueIds.length,
    failed: failed.length,
    concurrency,
  });

  return {
    operation,
    total: uniqueIds.length,
    succeeded,
    failed,
  };
}

type ContentAnalysisInput = {
  type: string;
  windowDays?: number;
};

export type ContentAnalysisSnapshot = {
  type: string;
  totals: {
    all: number;
    flagged: number;
    pendingModeration: number;
    publishedLastWindow: number;
  };
  averages: {
    reportsPerItem: number;
  };
};

export async function analyzeContent({
  type,
  windowDays = 30,
}: ContentAnalysisInput): Promise<ContentAnalysisSnapshot> {
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - windowDays);

  const query = `{
    "all": count(*[_type == $type]),
    "flagged": count(*[_type == $type && defined(moderationStatus) && moderationStatus.status == "flagged"]),
    "pendingModeration": count(*[_type == $type && defined(moderationStatus) && moderationStatus.status == "pending"]),
    "recent": count(*[_type == $type && _createdAt >= $windowStart])
  }`;

  const result = await client.fetch<{
    all: number;
    flagged: number;
    pendingModeration: number;
    recent: number;
  }>(query, { type, windowStart: windowStart.toISOString() });

  const reports = await client.fetch<number>(
    'sum(*[_type == $type && defined(reports)][]{"reportCount": count(reports)}.reportCount)',
    { type }
  );

  const totals = {
    all: result?.all ?? 0,
    flagged: result?.flagged ?? 0,
    pendingModeration: result?.pendingModeration ?? 0,
    publishedLastWindow: result?.recent ?? 0,
  };

  const averages = {
    reportsPerItem: totals.all > 0 ? Number(((reports ?? 0) / totals.all).toFixed(2)) : 0,
  };

  return {
    type,
    totals,
    averages,
  };
}

export type ModerationSummary = {
  queueSize: number;
  oldestItemAgeHours: number | null;
};

export async function summarizeModerationQueue(): Promise<ModerationSummary> {
  const queue = await fetchModerationQueue(25);
  if (!queue.length) {
    return { queueSize: 0, oldestItemAgeHours: null };
  }

  const now = Date.now();
  const oldest = queue.reduce((min, item) => {
    const ts = Date.parse(item.lastActivity);
    if (Number.isNaN(ts)) return min;
    return Math.min(min, ts);
  }, Infinity);

  const oldestItemAgeHours = Number.isFinite(oldest)
    ? Math.max(0, Math.round((now - oldest) / (1000 * 60 * 60)))
    : null;

  return { queueSize: queue.length, oldestItemAgeHours };
}
