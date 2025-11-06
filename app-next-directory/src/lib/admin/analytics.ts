import 'server-only';
import type { ModerationStatus } from '@sanity/sanity.types';
import { client } from '@/lib/sanity/client';
import { structuredLogger } from '@/lib/logger';

export type AdminModerationEntry = {
  id: string;
  itemType: string;
  itemName: string;
  itemId: string;
  reports: number;
  lastActivity: string;
  status: string;
};

export type AdminAnalyticsSnapshot = {
  overview: {
    totalUsers: number;
    totalListings: number;
    totalReviews: number;
    weeklySignups: number;
    pendingModeration: number;
  };
  userRoles: Record<string, number>;
  moderationQueue: AdminModerationEntry[];
  generatedAt: string;
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

async function fetchRoleCounts(): Promise<Record<string, number>> {
  const counts = await Promise.all(ROLE_QUERIES.map(({ query }) => client.fetch<number>(query)));
  return ROLE_QUERIES.reduce<Record<string, number>>((acc, { role }, index) => {
    acc[role] = counts[index] ?? 0;
    return acc;
  }, {});
}

type ModerationReport = NonNullable<ModerationStatus['userReports']>[number];

type ModerationQueueProjection = Pick<ModerationStatus, '_id' | '_createdAt' | 'status'> & {
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
  const queue = await client.fetch<ModerationQueueProjection[]>(
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
  ] = await Promise.all([
    client.fetch<number>('count(*[_type == "user"])'),
    client.fetch<number>('count(*[_type == "listing"])'),
    client.fetch<number>('count(*[_type == "review"])'),
    client.fetch<number>('count(*[_type == "moderationStatus" && status == "pending"])'),
    fetchModerationQueue(),
    fetchRoleCounts(),
  ]);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklySignups = await client.fetch<number>(
    'count(*[_type == "user" && _createdAt >= $sevenDaysAgo])',
    { sevenDaysAgo: sevenDaysAgo.toISOString() }
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
  failed: string[];
};

type BulkOperationInput = {
  operation: BulkOperationType;
  ids: string[];
};

export async function runBulkOperation({ operation, ids }: BulkOperationInput): Promise<BulkOperationResult> {
  if (!ids.length) {
    return { operation, total: 0, succeeded: 0, failed: [] };
  }

  const timestamp = new Date().toISOString();
  const patchDataFactory = BULK_OPERATION_PATCH[operation];
  if (!patchDataFactory) {
    throw new Error(`Unsupported bulk operation: ${operation}`);
  }

  const transaction = ids.reduce((trx, id) => {
    return trx.patch(id, (patch) => patch.set(patchDataFactory(timestamp)));
  }, client.transaction());

  try {
    await transaction.commit({ autoGenerateArrayKeys: true });
    return { operation, total: ids.length, succeeded: ids.length, failed: [] };
  } catch (error) {
    structuredLogger.error('[admin] bulk operation failed', error, {
      component: 'admin-analytics',
      operation,
    });
    return { operation, total: ids.length, succeeded: 0, failed: [...ids] };
  }
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
