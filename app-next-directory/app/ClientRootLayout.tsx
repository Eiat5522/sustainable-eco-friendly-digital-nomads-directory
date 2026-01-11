'use client';

import { useSearchParams } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface ClientRootLayoutProps {
  children: ReactNode;
}

export default function ClientRootLayout({ children }: Readonly<ClientRootLayoutProps>) {
  const isEnvTestMode = process.env.NEXT_PUBLIC_E2E === '1';
  const searchParams = useSearchParams();
  const urlIndicatesTestMode = searchParams.get('testMode') === 'true';
  const e2eFlag =
    typeof window !== 'undefined' && (window as Window & { __PW_E2E__?: boolean }).__PW_E2E__;
  const testModeActive = isEnvTestMode || urlIndicatesTestMode || Boolean(e2eFlag);

  useEffect(() => {
    if (testModeActive) {
      document.documentElement?.setAttribute('data-test-mode', 'true');
    } else {
      document.documentElement?.removeAttribute('data-test-mode');
    }
  }, [testModeActive]);

  return <SessionProvider>{children}</SessionProvider>;
}
