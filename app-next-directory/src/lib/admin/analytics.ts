import 'server-only';
import { getDefaultTimeout, withRequestTimeout } from '@/lib/http/request';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';

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

const ROLE_QUERIES = [
  { role: 'admin', query: 'count(*[_type == "user" && role == "admin"])' },
  {
    role: 'user',
    query: 'count(*[_type == "user" && (role == "user" || !defined(role))])',
  },
  { role: 'moderator', query: 'count(*[_type == "user" && role == "moderator"])' },
  { role: 'editor', query: 'count(*[_type == "user" && role == "editor"])' },
  { role: 'venueOwner', query: 'count(*[_type == "user" && role == "venueOwner"])' },
  { role: 'superAdmin', query: 'count(*[_type == "user" && role == "superAdmin"])' },
  { role: 'contentEditor', query: 'count(*[_type == "user" && role == "contentEditor"])' },
  { role: 'unidentifiedUser', query: 'count(*[_type == "user" && role == "unidentifiedUser"])' },
] as const;

type RoleKey = (typeof ROLE_QUERIES)[number]['role'];

export type AdminRoleCounts = Record<RoleKey, number>;

export const createEmptyRoleCounts = (): AdminRoleCounts =>
  Object.fromEntries(ROLE_QUERIES.map(({ role }) => [role, 0] as const)) as AdminRoleCounts;

export type AdminAnalyticsSnapshot = {
  overview: {
    totalUsers: number;
    totalListings: number;
    totalReviews: number;
    weeklySignups: number;
    pendingModeration: number;
  };
  userRoles: AdminRoleCounts;
  moderationQueue: AdminModerationEntry[];
  generatedAt: string;
};

type AdminAnalyticsTuple = [
  number,
  number,
  number,
  number,
  AdminModerationEntry[],
  AdminRoleCounts
];

async function fetchRoleCounts(): Promise<AdminRoleCounts> {
  const counts = await withRequestTimeout<number[]>(
    Promise.all(
      ROLE_QUERIES.map(({ query }) =>
        client.fetch<number>(query) as Promise<number>
      )
    ),
    getDefaultTimeout(),
    'Fetching admin role counts timed out'
  );
  const baseCounts = createEmptyRoleCounts();
  ROLE_QUERIES.forEach(({ role }, index) => {
    baseCounts[role] = counts[index] ?? 0;
  });
  return baseCounts;
}

type ModerationQueueProjection = Pick<ModerationStatusDocument, '_id' | '_createdAt' | 'status'> & {
  itemType?: string;
  itemName?: string;
  itemId?: string;
  userReports?: ModerationReport[] | null;
};

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

export async function fetchModerationQueue(limit = 10): Promise<AdminModerationEntry[]> {
  const queue = await withRequestTimeout<ModerationQueueProjection[]>(
    client.fetch<ModerationQueueProjection[]>(
      `*[_type == "moderationStatus" && status == "pending"] | order(_createdAt desc)[0...$limit] {
        _id,
        _createdAt,
        status,
        "itemType": item->._type,
        "itemName": coalesce(item->.name, item->.title, "Unnamed Item"),
        "itemId": item->._id,
        userReports
      }`,
      { limit }
    ) as Promise<ModerationQueueProjection[]>,
    getDefaultTimeout(),
    'Fetching moderation queue timed out'
  );

  return queue.map((item) => ({
    id: item._id,
    itemType: item.itemType ?? 'unknown',
    itemName: item.itemName ?? 'Unnamed Item',
    itemId: item.itemId ?? 'unknown',
    reports: normalizeReportCount(item.userReports),
    lastActivity: item._createdAt,
    status: item.status ?? 'pending',
  }));
}

export async function fetchAdminAnalytics(): Promise<AdminAnalyticsSnapshot> {
  const [
    userCount,
    listingCount,
    reviewCount,
    pendingModerationCount,
    moderationQueue,
    roleCounts,
  ] = await withRequestTimeout<AdminAnalyticsTuple>(
    Promise.all([
      client.fetch<number>('count(*[_type == "user"])') as Promise<number>,
      client.fetch<number>('count(*[_type == "listing"])') as Promise<number>,
      client.fetch<number>('count(*[_type == "review"])') as Promise<number>,
      client.fetch<number>('count(*[_type == "moderationStatus" && status == "pending"])') as Promise<number>,
      fetchModerationQueue(),
      fetchRoleCounts(),
    ]) as Promise<AdminAnalyticsTuple>,
    getDefaultTimeout(),
    'Fetching admin analytics summary timed out'
  );

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklySignups = await withRequestTimeout<number>(
    client.fetch<number>(
      'count(*[_type == "user" && _createdAt >= $sevenDaysAgo])',
      { sevenDaysAgo: sevenDaysAgo.toISOString() }
    ) as Promise<number>,
    getDefaultTimeout(),
    'Fetching weekly signups timed out'
  );

  return {
    overview: {
      totalUsers: userCount ?? 0,
      totalListings: listingCount ?? 0,
      totalReviews: reviewCount ?? 0,
      weeklySignups: weeklySignups ?? 0,
      pendingModeration: pendingModerationCount ?? 0,
    },
    userRoles: roleCounts,
    moderationQueue,
    generatedAt: new Date().toISOString(),
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
  const patch = client
    .patch(moderationId)
    .set(
      status
        ? { status, lastActionAt: timestamp }
        : { lastActionAt: timestamp }
    )
    .setIfMissing(createEmptyModerationHistory())
    .append('moderationHistory', [createModerationHistoryEntry(action, actorId, notes, timestamp)]);

  if (notes) {
    patch.set({ resolutionNotes: notes });
  }

  await patch.commit({ autoGenerateArrayKeys: true });

  const [updatedEntry] = await fetchModerationQueue(1);
  return updatedEntry ?? null;
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
  const transaction = client.transaction();

  for (const id of batchIds) {
    transaction.patch(id, (patch) => patch.set(patchFactory(timestamp)));
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
      failed: batchIds.map((id) => ({ id, reason: 'commitFailed', errorMessage })),
    };
  }
};

const processBatches = async (
  batches: IdChunk[],
  patchFactory: PatchFactory,
  timestamp: string,
  operation: BulkOperationType
): Promise<BulkBatchResult[]> => {
  if (batches.length === 0) {
    return [];
  }

  const results: BulkBatchResult[] = new Array(batches.length);
  const concurrency = Math.min(BULK_OPERATION_MAX_CONCURRENCY, batches.length);
  let pointer = 0;

  const worker = async () => {
    while (true) {
      const currentIndex = pointer;
      pointer += 1;
      if (currentIndex >= batches.length) {
        break;
      }

      const batchIds = batches[currentIndex];
      results[currentIndex] = await commitBatch(
        batchIds,
        patchFactory,
        timestamp,
        currentIndex,
        batches.length,
        operation
      );
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
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

const BULK_OPERATION_PATCH: Record<BulkOperationType, (timestamp: string) => ListingWorkflowPatch> = {
  publishListings: (timestamp) => ({
    'adminWorkflow.status': 'published',
    'adminWorkflow.lastChangedAt': timestamp,
  }),
  unpublishListings: (timestamp) => ({
    'adminWorkflow.status': 'unpublished',
    'adminWorkflow.lastChangedAt': timestamp,
  }),
  featureListings: (timestamp) => ({
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

export async function runBulkOperation({ operation, ids }: BulkOperationInput): Promise<BulkOperationResult> {
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
  const results = await processBatches(batches, patchDataFactory, timestamp, operation);

  const succeeded = results.reduce((acc, result) => acc + result.succeeded.length, 0);
  const failed = results.flatMap((result) => result.failed);

  const duration = now() - start;
  structuredLogger.performance(`admin.bulk.${operation}`, duration, {
    component: 'admin-bulk-operations',
    operation,
    batches: batches.length,
    totalIds: uniqueIds.length,
    failed: failed.length,
    concurrency: Math.min(BULK_OPERATION_MAX_CONCURRENCY, batches.length),
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

export async function analyzeContent({ type, windowDays = 30 }: ContentAnalysisInput): Promise<ContentAnalysisSnapshot> {
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - windowDays);

  const query = `{
    "all": count(*[_type == $type]),
    "flagged": count(*[_type == $type && defined(moderationStatus) && moderationStatus.status == "flagged"]),
    "pendingModeration": count(*[_type == $type && defined(moderationStatus) && moderationStatus.status == "pending"]),
    "recent": count(*[_type == $type && _createdAt >= $windowStart])
  }`;

  const result = await client.fetch<{ all: number; flagged: number; pendingModeration: number; recent: number }>(
    query,
    { type, windowStart: windowStart.toISOString() }
  );

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
