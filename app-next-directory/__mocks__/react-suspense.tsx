// Mock Suspense to render children immediately in tests
import type React from 'react';

export function Suspense({ children }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <>{children}</>;
}
