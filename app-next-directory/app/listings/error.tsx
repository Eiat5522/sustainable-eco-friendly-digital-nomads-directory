'use client';

import { useEffect } from 'react';
import { NeoButton } from '@/components/ui/neo-button';
import { structuredLogger } from '@/lib/logger';

export default function ListingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    structuredLogger.error('App segment error caught', error, {
      component: 'listings',
      digest: error.digest,
    });
  }, [error]);

  return (
    <section
      className="min-h-screen flex items-center justify-center bg-background p-6"
      aria-labelledby="error-title"
    >
      <div className="max-w-xl text-center">
        <h1 id="error-title" className="heading-lg mb-3">
          Unexpected error
        </h1>
        <p className="body-md text-neo-text-secondary mb-6" role="alert">
          Something went wrong. Try again and we’ll give it another shot.
        </p>

        <div className="flex items-center justify-center gap-3">
          <NeoButton variant="primary" onClick={() => reset()}>
            Retry
          </NeoButton>
          <NeoButton variant="outline" onClick={() => window.location.reload()}>
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
  );
}
