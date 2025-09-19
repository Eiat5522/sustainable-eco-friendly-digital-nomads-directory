import { client } from '@/lib/sanity/client';
import { structuredLogger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';

type EnsureUserOptions = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: UserRole | null;
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
export async function ensureSanityUser({ id, name, email, role }: EnsureUserOptions): Promise<SanityUser | null> {
  if (!id) {
    return null;
  }

  const safeEmail = normaliseEmail(email);
  const safeName = normaliseName(name) ?? FALLBACK_NAME;
  const safeRole = role ?? 'user';

  try {
    const baseDoc = await client.createIfNotExists<SanityUser>({
      _id: id,
      _type: 'user',
      name: safeName,
      ...(safeEmail ? { email: safeEmail } : {}),
      role: safeRole,
      createdAt: new Date().toISOString(),
    });

    const patch: Record<string, string> = {};

    if (baseDoc.name !== safeName) {
      patch.name = safeName;
    }

    if (safeEmail && baseDoc.email !== safeEmail) {
      patch.email = safeEmail;
    }

    if (baseDoc.role !== safeRole) {
      patch.role = safeRole;
    }

    if (Object.keys(patch).length === 0) {
      return baseDoc;
    }

    const updated = await client.patch(id).set(patch).commit<SanityUser>({ autoGenerateArrayKeys: true });
    return updated;
  } catch (error) {
    structuredLogger.error('Failed to ensure Sanity user document', error, {
      component: 'sanity-user-sync',
      userId: id,
    });
    return null;
  }
}
