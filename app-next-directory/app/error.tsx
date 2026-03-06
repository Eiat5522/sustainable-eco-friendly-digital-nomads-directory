'use client';

import React from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { structuredLogger } from '@/lib/logger';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log error for diagnostics in both dev and production
  React.useEffect(() => {
    structuredLogger.error('App segment error caught', error, {
      component: 'app',
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-background">
      <section
        className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-16"
        aria-labelledby="error-title"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-neo-secondary/20 via-transparent to-neo-primary/15" />
        <div className="neo-card relative max-w-lg w-full text-center rounded-lg p-6 shadow-[12px_12px_0px_0px]">
          <h1 id="error-title" className="heading-xl mb-2 text-neo-text-primary">
            Unexpected error
          </h1>
          <p className="text-xl font-semibold text-neo-text-primary mb-6" role="alert">
            Something went wrong while loading this page.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <NeoButton variant="primary" size="lg" onClick={() => reset()}>
              Retry
            </NeoButton>
            <NeoButton variant="outline" size="lg" onClick={() => window.location.reload()}>
              Reload
            </NeoButton>
          </div>
          {process.env.NODE_ENV !== 'production' && (
            <pre className="mt-6 p-3 bg-red-50 text-red-700 rounded text-left whitespace-pre-wrap text-sm">
              {error.message}
            </pre>
          )}
        </div>
      </section>
    </div>
  );
}
