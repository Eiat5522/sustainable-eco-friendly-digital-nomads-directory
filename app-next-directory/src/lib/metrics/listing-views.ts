import { getCollection } from '@/utils/db-helpers';

const COLLECTION_NAME = 'listingViewMetrics';

export type ListingViewMetricDocument = {
  listingId: string;
  month: string; // YYYY-MM
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
};

function ensureMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

let indexPromise: Promise<void> | null = null;

async function getMetricsCollection() {
  const collection = await getCollection(COLLECTION_NAME);
  if (!indexPromise) {
    indexPromise = collection.createIndex({ listingId: 1, month: 1 }, { unique: true }).catch((error: unknown) => {
      if (!(error instanceof Error) || !error.message.includes('already exists')) {
        throw error;
      }
    });
  }
  return collection as {
    updateOne: typeof import('mongodb').Collection.prototype.updateOne;
    find: typeof import('mongodb').Collection.prototype.find;
    aggregate: typeof import('mongodb').Collection.prototype.aggregate;
  };
}

export async function recordListingView(listingId: string, viewedAt: Date = new Date()): Promise<void> {
  if (!listingId) throw new Error('listingId is required to record a view');
  const collection = await getMetricsCollection();
  const month = ensureMonthKey(viewedAt);
  await collection.updateOne(
    { listingId, month },
    {
      $inc: { viewCount: 1 },
      $set: { updatedAt: viewedAt },
      $setOnInsert: { createdAt: viewedAt },
    },
    { upsert: true },
  );
}

export async function getMonthlyViewCounts(
  listingIds: string[],
  monthKeys: string[],
): Promise<Map<string, Map<string, number>>> {
  if (listingIds.length === 0 || monthKeys.length === 0) {
    return new Map();
  }
  const collection = await getMetricsCollection();
  const cursor = collection.find({ listingId: { $in: listingIds }, month: { $in: monthKeys } });
  const results = await cursor.toArray();
  const map = new Map<string, Map<string, number>>();
  for (const doc of results as ListingViewMetricDocument[]) {
    const byListing = map.get(doc.listingId) ?? new Map<string, number>();
    byListing.set(doc.month, doc.viewCount ?? 0);
    map.set(doc.listingId, byListing);
  }
  return map;
}

export async function getLifetimeViewCounts(listingIds: string[]): Promise<Map<string, number>> {
  if (listingIds.length === 0) {
    return new Map();
  }
  const collection = await getMetricsCollection();
  const pipeline = [
    { $match: { listingId: { $in: listingIds } } },
    { $group: { _id: '$listingId', viewCount: { $sum: '$viewCount' } } },
  ];
  const cursor = collection.aggregate(pipeline);
  const results = await cursor.toArray();
  const map = new Map<string, number>();
  for (const doc of results as Array<{ _id: string; viewCount: number }>) {
    map.set(doc._id, doc.viewCount ?? 0);
  }
  return map;
}
