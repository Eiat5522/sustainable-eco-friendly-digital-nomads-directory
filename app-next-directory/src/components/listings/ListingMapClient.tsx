'use client';

import type { ErrorInfo, ReactNode } from 'react';
import { Component, Suspense } from 'react';
import dynamic from 'next/dynamic';

const InteractiveMap = dynamic(
  () => import('@/components/ui/interactive-map').then(mod => mod.InteractiveMap),
  { ssr: false }
);

type ListingMapClientProps = {
  location?: { lat: number; lng: number };
  address?: string;
  name: string;
};

class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // biome-ignore lint/suspicious/noConsole: fallback logging for unexpected map failures
    console.error('Map loading error:', error, errorInfo);
    this.setState({ hasError: true });
  }

  render(): React.ReactNode {
    if (this.state.hasError || !this.props.children) {
      return (
        <div
          className="h-64 w-full rounded-lg bg-muted flex items-center justify-center text-sm"
          role="alert"
        >
          Unable to load map
        </div>
      );
    }
    return this.props.children;
  }
}

export function ListingMapClient({
  location,
  address,
  name,
}: ListingMapClientProps): React.JSX.Element {
  return (
    <MapErrorBoundary>
      <Suspense
        fallback={
          <>
            <div className="h-64 w-full rounded-lg bg-muted animate-pulse" aria-hidden="true" />
            <span className="sr-only" role="status" aria-live="polite">
              Loading map…
            </span>
          </>
        }
      >
        <InteractiveMap location={location} address={address} name={name} />
      </Suspense>
    </MapErrorBoundary>
  );
}
