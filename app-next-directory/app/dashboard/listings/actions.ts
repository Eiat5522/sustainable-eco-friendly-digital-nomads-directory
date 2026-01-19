'use server';

import { auth } from '@/lib/auth';
import {
  createManagedListing,
  updateManagedListing,
} from '@/lib/data-access/listing-management.dal';
import { structuredLogger } from '@/lib/logger';
import type { UserRole } from '@/types/auth';
import type { ListingFormValues } from '../components/VenueListingForm';

type ListingPayload = ListingFormValues & Record<string, unknown>;

type SessionUser = {
  id?: string;
  role?: UserRole;
};

function requireSessionUser(sessionUser: SessionUser | undefined) {
  if (!sessionUser?.id || !sessionUser.role) {
    throw new Error('Unauthorized');
  }
  return { id: sessionUser.id, role: sessionUser.role };
}

export async function createListingAction(data: ListingPayload) {
  try {
    const session = await auth();
    const user = requireSessionUser(session?.user as SessionUser | undefined);
    return await createManagedListing(data, user);
  } catch (error) {
    structuredLogger.error('Failed to create listing via action', error, {
      component: 'listing-actions',
    });
    throw error;
  }
}

export async function updateListingAction(listingId: string, data: ListingPayload) {
  try {
    const session = await auth();
    const user = requireSessionUser(session?.user as SessionUser | undefined);
    return await updateManagedListing(listingId, data, user);
  } catch (error) {
    structuredLogger.error('Failed to update listing via action', error, {
      component: 'listing-actions',
      listingId,
    });
    throw error;
  }
}
