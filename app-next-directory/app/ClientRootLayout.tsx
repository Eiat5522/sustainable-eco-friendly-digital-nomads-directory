'use client';

import { SessionProvider } from 'next-auth/react';
import { type ReactNode, Suspense } from 'react';
import { TestModeHandler } from './TestModeHandler';

interface ClientRootLayoutProps {
  children: ReactNode;
}

export default function ClientRootLayout({ children }: Readonly<ClientRootLayoutProps>) {
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <TestModeHandler />
      </Suspense>
      {children}
    </SessionProvider>
  );
}
