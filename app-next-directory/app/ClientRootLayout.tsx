'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

interface ClientRootLayoutProps {
  children: ReactNode;
}

export default function ClientRootLayout({ children }: Readonly<ClientRootLayoutProps>) {
  const isEnvTestMode = process.env.NEXT_PUBLIC_E2E === '1';
  const initialTestMode = useMemo(() => {
    if (typeof window === 'undefined') return isEnvTestMode;
    const params = new URLSearchParams(window.location.search);
    const urlIndicatesTestMode = params.get('testMode') === 'true';
    const e2eFlag = (window as Window & { __PW_E2E__?: boolean }).__PW_E2E__;
    return isEnvTestMode || urlIndicatesTestMode || Boolean(e2eFlag);
  }, [isEnvTestMode]);
  const [testModeActive, setTestModeActive] = useState(initialTestMode);

  useEffect(() => {
    if (testModeActive) {
      document.documentElement?.setAttribute('data-test-mode', 'true');
    } else {
      document.documentElement?.removeAttribute('data-test-mode');
    }
  }, [testModeActive]);

  useEffect(() => {
    if (isEnvTestMode) return;
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlIndicatesTestMode = params.get('testMode') === 'true';
    const e2eFlag = (window as Window & { __PW_E2E__?: boolean }).__PW_E2E__;
    if (urlIndicatesTestMode || e2eFlag) {
      setTestModeActive(true);
    } else {
      setTestModeActive(false);
    }
  }, [isEnvTestMode]);

  return <SessionProvider>{children}</SessionProvider>;
}
