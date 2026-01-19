import Link from 'next/link';
import { NeoButton } from '@/components/ui/neo-button';
import {
  NeoCard,
  NeoCardContent,
  NeoCardDescription,
  NeoCardHeader,
  NeoCardTitle,
} from '@/components/ui/neo-card';
import { auth } from '@/lib/auth';
import { getListingFormOptions } from '@/lib/data-access/listing-form-options.dal';
import { createListingAction } from '../actions';
import { ListingFormController } from '../components/ListingFormController';
import { structuredLogger } from '@/lib/logger';

export default async function NewListingPage() {
  const session = await auth();
  const sessionUser = session?.user as { id?: string } | undefined;

  if (!sessionUser?.id) {
    return (
      <div className="min-h-screen bg-neo-surface/70 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl border-4 border-amber-200 bg-amber-50 p-6 text-amber-700">
          Please sign in to create listings.
        </div>
      </div>
    );
  }

  let options: Awaited<ReturnType<typeof getListingFormOptions>>;

  try {
    options = await getListingFormOptions();
  } catch (error) {
    structuredLogger.error('Failed to load listing form options', error);

    return (
      <div className="min-h-screen bg-neo-surface/70 px-4 py-12">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-neo-text-tertiary">
              Venue owner workspace
            </p>
            <h1 className="heading-xl text-neo-text-primary">Add New Listing</h1>
            <p className="text-sm text-neo-text-secondary">
              We ran into an issue loading the listing form. Please retry or come back later.
            </p>
          </header>

          <NeoCard
            variant="elevated"
            className="border-4 border-neo-border bg-white/95 shadow-[12px_12px_0px_0px_rgba(15,23,42,0.3)]"
          >
            <NeoCardHeader className="space-y-2">
              <NeoCardTitle>Unable to load form</NeoCardTitle>
              <NeoCardDescription className="text-sm text-neo-text-secondary">
                Check your connection and try again, or return to your listings.
              </NeoCardDescription>
            </NeoCardHeader>
            <NeoCardContent className="flex flex-wrap gap-3">
              <NeoButton asChild className="shadow-[4px_4px_0px_0px_#0f172a]">
                <Link href="/dashboard/listings/new">Retry</Link>
              </NeoButton>
              <NeoButton asChild variant="secondary" className="shadow-[4px_4px_0px_0px_#0f172a]">
                <Link href="/dashboard/listings">Back to listings</Link>
              </NeoButton>
            </NeoCardContent>
          </NeoCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neo-surface/70 px-4 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-neo-text-tertiary">
              Venue owner workspace
            </p>
            <h1 className="heading-xl text-neo-text-primary">Add New Listing</h1>
            <p className="text-sm text-neo-text-secondary">
              Capture the details that make your space unforgettable for eco-conscious nomads.
            </p>
          </div>
          <NeoButton asChild variant="secondary" className="shadow-[4px_4px_0px_0px_#0f172a]">
            <Link href="/dashboard/listings">Back to listings</Link>
          </NeoButton>
        </header>

        <NeoCard
          variant="elevated"
          className="border-4 border-neo-border bg-white/95 shadow-[12px_12px_0px_0px_rgba(15,23,42,0.3)]"
        >
          <NeoCardHeader className="space-y-2">
            <NeoCardTitle>Listing details</NeoCardTitle>
            <NeoCardDescription className="text-sm text-neo-text-secondary">
              Share the essentials, amenities, and sustainability features your guests care about.
            </NeoCardDescription>
          </NeoCardHeader>
          <NeoCardContent className="space-y-6">
            <ListingFormController
              onSave={createListingAction}
              redirectTo="/dashboard/listings"
              errorFallback="Failed to create listing"
              options={options}
            />
          </NeoCardContent>
        </NeoCard>
      </div>
    </div>
  );
}
