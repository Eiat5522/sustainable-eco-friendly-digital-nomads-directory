import Link from 'next/link';
import { NeoButton } from '@/components/ui/neo-button';
import { NeoCard, NeoCardContent, NeoCardHeader, NeoCardTitle } from '@/components/ui/neo-card';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neo-surface p-4">
      <NeoCard className="max-w-md w-full text-center">
        <NeoCardHeader>
          <NeoCardTitle className="text-4xl mb-2">404 - Page Not Found</NeoCardTitle>
        </NeoCardHeader>
        <NeoCardContent>
          <p className="body-lg text-neo-text-secondary mb-6">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
          <NeoButton asChild variant="primary" size="lg">
            <Link href="/">Go back home</Link>
          </NeoButton>
        </NeoCardContent>
      </NeoCard>
    </div>
  );
}
