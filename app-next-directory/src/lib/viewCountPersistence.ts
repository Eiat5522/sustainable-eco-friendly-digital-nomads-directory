/**
 * Blog View Count Persistence Layer
 *
 * Manages persistent storage of blog post view counts in MongoDB.
 * Collection: blogViewCounts
 * Schema: { postId: string, count: number, lastViewed: Date }
 */

import clientPromise from './mongodb';

export interface ViewCountRecord {
  postId: string;
  count: number;
  lastViewed: Date;
}

const COLLECTION_NAME = 'blogViewCounts';

/**
 * Increment view count for a blog post in the database
 * Uses atomic $inc operation to ensure consistency under concurrent requests
 *
 * @param postId - The unique identifier of the blog post
 * @returns The updated view count
 */
export async function incrementViewCount(postId: string): Promise<number> {
  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid postId: must be a non-empty string');
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(COLLECTION_NAME);

    // Use findOneAndUpdate with $inc for atomic increment
    // upsert: true ensures document is created if it doesn't exist
    const result = await collection.findOneAndUpdate(
      { postId },
      {
        $inc: { count: 1 },
        $set: { lastViewed: new Date() },
      },
      {
        upsert: true,
        returnDocument: 'after',
      }
    );

    if (!result) {
      throw new Error('Database operation returned no result');
    }
    // Handle the result based on MongoDB driver version
    const updatedDoc = result.value || result;

    if (!updatedDoc || typeof updatedDoc.count !== 'number') {
      // This should not happen with upsert: true, indicates a database error
      throw new Error('Database operation completed but returned invalid result');
    }

    return updatedDoc.count;
  } catch (_error) {
    throw new Error('Failed to update view count in database');
  }
}

/**
 * Get view count for a blog post
 *
 * @param postId - The unique identifier of the blog post
 * @returns The current view count, or 0 if not found
 */
export async function getViewCount(postId: string): Promise<number> {
  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid postId: must be a non-empty string');
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(COLLECTION_NAME);

    const record = await collection.findOne({ postId });
    return record?.count ?? 0;
  } catch (_error) {
    return 0;
  }
}

/**
 * Initialize the view counts collection with proper indexes
 * Called during application startup
 */
export async function initializeViewCountsCollection(): Promise<void> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(COLLECTION_NAME);

    // Create index on postId for fast lookups
    await collection.createIndex({ postId: 1 }, { unique: true });

    // Create index on lastViewed for potential analytics queries
    await collection.createIndex({ lastViewed: -1 });
  } catch (_error) {}
}

/**
 * Reset all view counts (for testing purposes only)
 * Should only be used in test environment
 */
export async function resetViewCounts(): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('resetViewCounts can only be called in test environment');
  }
  const client = await clientPromise;
  const db = client.db();
  const collection = db.collection(COLLECTION_NAME);
  await collection.deleteMany({});
}
