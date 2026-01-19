import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { getListingFormOptions } from '@/lib/data-access/listing-form-options.dal';
import { getManagedListingForEdit } from '@/lib/data-access/listing-management.dal';
import type { UserRole } from '@/types/auth';
import { listingFormSchema } from '../../../components/listing-form.schema';
import { updateListingAction } from '../../actions';
import { ListingFormController } from '../../components/ListingFormController';

type PageProps = { params: Promise<{ id: string }> };

export async function EditListingContent({ params }: PageProps) {
  const { id: listingId } = await params;
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: UserRole } | undefined;

  if (!sessionUser?.id) {
    return (
      <div className="min-h-screen bg-neo-surface/70 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border-4 border-amber-200 bg-amber-50 p-6 text-amber-700">
          Please sign in to edit listings.
        </div>
      </div>
    );
  }

  const options = await getListingFormOptions();
  const listing = await getManagedListingForEdit(listingId, {
    id: sessionUser.id,
    role: sessionUser.role ?? 'user',
  });

  if (!listing) {
    return (
      <div className="min-h-screen bg-neo-surface/70 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border-4 border-rose-200 bg-rose-50 p-6 text-rose-700">
          Listing not found or you don&apos;t have permission to edit it.
        </div>
      </div>
    );
  }

  const parsedListing = listingFormSchema.safeParse(listing);

  if (!parsedListing.success) {
    return (
      <div className="min-h-screen bg-neo-surface/70 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border-4 border-rose-200 bg-rose-50 p-6 text-rose-700">
          We could not load this listing for editing. Please contact support if the issue
          persists.
        </div>
      </div>
    );
  }

  const updateAction = updateListingAction.bind(null, listingId);

  return (
    <div className="min-h-screen bg-neo-surface/70 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neo-text-tertiary">
            Venue owner workspace
          </p>
          <h1 className="heading-xl text-neo-text-primary">Edit Listing</h1>
          <p className="text-sm text-neo-text-secondary">
            Refresh the details and keep your listing accurate for visitors.
          </p>
        </header>

        <div className="rounded-3xl border-4 border-neo-border bg-white/95 p-6 shadow-[10px_10px_0px_0px_rgba(15,23,42,0.25)]">
          <ListingFormController
            listing={parsedListing.data}
            onSave={updateAction}
            redirectTo="/dashboard/listings"
            errorFallback="An error occurred while saving"
            options={options}
          />
        </div>
      </div>
    </div>
  );
}

export default async function EditListingPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neo-surface/70 px-4 py-12">
          <div className="mx-auto max-w-3xl rounded-2xl border-4 border-neo-border bg-white/95 p-6 shadow-[8px_8px_0px_0px_rgba(15,23,42,0.2)]">
            Loading listing details…
          </div>
        </div>
      }
    >
      <EditListingContent params={params} />
    </Suspense>
  );
}
