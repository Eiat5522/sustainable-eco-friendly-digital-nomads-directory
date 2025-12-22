import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';

type EnsureUserOptions = {
  id: string;
  name?: string | null;
  email?: string | null;
};

type SanityUser = {
  _id: string;
  _type: 'user';
  name?: string;
  email?: string;
  role?: string;
  createdAt?: string;
};

const FALLBACK_NAME = 'Anonymous';

function normaliseEmail(email: string | null | undefined): string | undefined {
  if (!email) return undefined;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normaliseName(name: string | null | undefined): string | undefined {
  if (!name) return undefined;
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Ensures a corresponding Sanity `user` document exists for the authenticated NextAuth user.
 * Creates the document when missing and keeps key identity fields (name/email/role) up to date.
 */
async function ensureSanityUserInternal({ id, name, email }: EnsureUserOptions): Promise<SanityUser | null> {
  if (!id) {
    return null;
  }

  const safeEmail = normaliseEmail(email);
  const safeName = normaliseName(name) ?? FALLBACK_NAME;
  // Remove role handling from Sanity sync — Sanity is CMS-only for roles
  

  try {
    // Create or ensure a minimal CMS-only Sanity user doc. Do NOT write role information.
    const baseDoc = await client.createIfNotExists!<SanityUser>({
      _id: id,
      _type: 'user',
      name: safeName,
      ...(safeEmail ? { email: safeEmail } : {}),
      createdAt: new Date().toISOString(),
    });

    const patch: Record<string, string> = {};

    if (baseDoc.name !== safeName) {
      patch.name = safeName;
    }

    if (safeEmail && baseDoc.email !== safeEmail) {
      patch.email = safeEmail;
    }

    // Do not touch `role` in Sanity — MongoDB is the single source of truth for auth/roles.

    if (Object.keys(patch).length === 0) {
      return baseDoc;
    }

    const updated = await client.patch!(id)
      .set(patch)
      .commit<SanityUser>({ autoGenerateArrayKeys: true });
    return updated;
  } catch (error) {
    structuredLogger.error('Failed to ensure Sanity user document', error, {
      component: 'sanity-user-sync',
      userId: id,
    });
    return null;
  }
}

/**
 * Remove a listing from a user's favorites
 * @param userId User ID
 * @param listingId Listing ID
 */
export async function unfavoriteListing(userId: string, listingId: string): Promise<void> {
  try {
    const favorite = await client.fetch<{ _id: string } | null>(
      `*[_type == "userFavorite" && user._ref == $userId && listing._ref == $listingId][0]`,
      { userId, listingId }
    );

    if (favorite) {
      await client.delete?.(favorite._id);
    }
  } catch (error) {
    structuredLogger.error('Failed to unfavorite listing', error, {
      component: 'sanity-user-actions',
      userId,
      listingId,
    });
  }
}

const isTestEnvironment = Boolean(process.env.JEST_WORKER_ID);

type EnsureSanityUserFn = (options: EnsureUserOptions) => Promise<SanityUser | null>;

interface MockableEnsureSanityUser extends EnsureSanityUserFn {
  mockResolvedValueOnce: (value: SanityUser | null) => MockableEnsureSanityUser;
  mockImplementation: (
    impl: (options: EnsureUserOptions) => SanityUser | null | Promise<SanityUser | null>
  ) => MockableEnsureSanityUser;
  mockClear: () => MockableEnsureSanityUser;
  mockReset: () => MockableEnsureSanityUser;
  mock: {
    calls: EnsureUserOptions[];
  };
  _isMockFunction: true;
}

const createMockableEnsureSanityUser = (): MockableEnsureSanityUser => {
  const state: {
    queue: Array<(options: EnsureUserOptions) => Promise<SanityUser | null>>;
    implementation?: (options: EnsureUserOptions) => Promise<SanityUser | null>;
    calls: EnsureUserOptions[];
  } = {
    queue: [],
    implementation: undefined,
    calls: [],
  };

  const mockFn = async function ensureSanityUserMock(
    options: EnsureUserOptions
  ): Promise<SanityUser | null> {
    state.calls.push(options);
    if (state.queue.length > 0) {
      const resolver = state.queue.shift()!;
      return resolver(options);
    }
    if (state.implementation) {
      return state.implementation(options);
    }
    return ensureSanityUserInternal(options);
  } as MockableEnsureSanityUser;

  mockFn.mockResolvedValueOnce = (value: SanityUser | null) => {
    state.queue.push(async () => value);
    return mockFn;
  };

  mockFn.mockImplementation = (
    impl: (options: EnsureUserOptions) => SanityUser | null | Promise<SanityUser | null>
  ) => {
    state.implementation = async options => Promise.resolve(impl(options));
    return mockFn;
  };

  mockFn.mockClear = () => {
    state.calls = [];
    state.queue = [];
    return mockFn;
  };

  mockFn.mockReset = () => {
    state.calls = [];
    state.queue = [];
    state.implementation = undefined;
    return mockFn;
  };

  Object.defineProperty(mockFn, '_isMockFunction', { value: true });
  Object.defineProperty(mockFn, 'mock', {
    configurable: true,
    enumerable: false,
    get: () => ({ calls: state.calls }),
  });

  return mockFn;
};

export const ensureSanityUser: EnsureSanityUserFn = isTestEnvironment
  ? createMockableEnsureSanityUser()
  : ensureSanityUserInternal;
