'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

interface ClientRootLayoutProps {
  children: ReactNode;
}

export default function ClientRootLayout({ children }: Readonly<ClientRootLayoutProps>) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
