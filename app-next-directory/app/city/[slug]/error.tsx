'use client';

import { NeoButton } from '@/components/ui/neo-button';

export default function CityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <h1 className="heading-lg mb-4">Something went wrong loading this city</h1>
        <p className="body-md text-neo-text-secondary mb-6">
          This may be a temporary issue. You can try again.
        </p>
        <div className="flex items-center justify-center gap-3">
          <NeoButton variant="primary" onClick={() => reset()}>
            Retry
          </NeoButton>
          <NeoButton variant="outline" onClick={() => window.location.reload()}>
            Full Refresh
          </NeoButton>
        </div>
        {process.env.NODE_ENV !== 'production' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer">Error details</summary>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-red-600">{error.message}</pre>
          </details>
        )}
      </div>
    </section>
  );
}
