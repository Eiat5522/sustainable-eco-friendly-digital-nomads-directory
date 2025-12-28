import { createClient } from 'next-sanity';
import dbConnect from '../lib/dbConnect';
import { structuredLogger } from '../lib/logger';
import User from '../models/User';

type SanityUser = {
  _id: string;
  email?: string;
  mongodbId?: string;
};

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: 'v2023-06-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const isDryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';
const mongoUri = process.env.MONGODB_URI;

async function findSanityUserByMongoId(mongodbId: string): Promise<SanityUser | null> {
  return await client.fetch<SanityUser | null>(`*[_type == "user" && mongodbId == $mongodbId][0]`, {
    mongodbId,
  });
}

async function findSanityUserByEmail(email: string): Promise<SanityUser | null> {
  return await client.fetch<SanityUser | null>(`*[_type == "user" && email == $email][0]`, {
    email,
  });
}

async function updateSanityUserMongoId(id: string, mongodbId: string): Promise<void> {
  if (isDryRun) return;
  await client.patch(id).set({ mongodbId }).commit();
}

async function updateMongoSanityId(userId: string, sanityId: string): Promise<void> {
  if (isDryRun) return;
  await User.updateOne({ _id: userId }, { $set: { sanityId } });
}

async function run(): Promise<void> {
  if (!mongoUri) {
    structuredLogger.error('[backfill-user-cross-ids] MONGODB_URI is required to run the script', {
      component: 'backfill-user-cross-ids',
    });
    process.exitCode = 1;
    return;
  }

  await dbConnect();

  const users = await User.find({
    $or: [{ sanityId: { $exists: false } }, { sanityId: null }, { sanityId: '' }],
  })
    .select('_id email sanityId')
    .lean<{ _id: string; email?: string | null; sanityId?: string | null }[]>();

  const unmatched: string[] = [];

  for (const user of users) {
    const mongodbId = String(user._id);
    const email = user.email?.toLowerCase() ?? null;

    const sanityUser =
      (await findSanityUserByMongoId(mongodbId)) ??
      (email ? await findSanityUserByEmail(email) : null);

    if (!sanityUser) {
      unmatched.push(mongodbId);
      continue;
    }

    if (sanityUser.mongodbId !== mongodbId) {
      await updateSanityUserMongoId(sanityUser._id, mongodbId);
    }

    if (user.sanityId !== sanityUser._id) {
      await updateMongoSanityId(mongodbId, sanityUser._id);
    }
  }

  if (unmatched.length > 0) {
    structuredLogger.warn('[backfill-user-cross-ids] Unmatched users require manual mapping', {
      count: unmatched.length,
      userIds: unmatched,
    });
  }

  structuredLogger.info('[backfill-user-cross-ids] Complete', {
    processed: users.length,
    unmatched: unmatched.length,
    dryRun: isDryRun,
  });
}

run().catch(error => {
  structuredLogger.error('[backfill-user-cross-ids] Failed', error);
  process.exitCode = 1;
});
