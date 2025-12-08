import Link from 'next/link';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neo-surface p-4">
      <NeoCard className="max-w-md w-full text-center">
        <NeoCardHeader>
          <NeoCardTitle className="text-4xl mb-2">404 - Listing Not Found</NeoCardTitle>
        </NeoCardHeader>
        <NeoCardContent>
          <p className="body-lg text-neo-text-secondary mb-6">
            Sorry, we couldn&apos;t find this listing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <NeoButton asChild variant="primary">
              <Link href="/listings">Browse Listings</Link>
            </NeoButton>
            <NeoButton asChild variant="outline">
              <Link href="/">Go Home</Link>
            </NeoButton>
          </div>
        </NeoCardContent>
      </NeoCard>
    </div>
  );
}
