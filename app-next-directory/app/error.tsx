"use client";

import React from 'react';
import { NeoButton } from '@/components/ui/neo-button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  return (
    <html>
      <body>
        <section className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-xl text-center">
            <h1 className="heading-lg mb-3">Unexpected error</h1>
            <p className="body-md text-neo-text-secondary mb-6">Something went wrong. Try again and we’ll give it another shot.</p>
            <div className="flex items-center justify-center gap-3">
              <NeoButton variant="primary" onClick={() => reset()}>Retry</NeoButton>
              <NeoButton variant="outline" onClick={() => window.location.reload()}>Reload</NeoButton>
            </div>
            {process.env.NODE_ENV !== 'production' && (
              <pre className="mt-6 p-3 bg-red-50 text-red-700 rounded text-left whitespace-pre-wrap text-sm">{error.message}</pre>
            )}
          </div>
        </section>
      </body>
    </html>
  );
}

