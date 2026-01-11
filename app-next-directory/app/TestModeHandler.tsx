'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';

const IS_ENV_TEST_MODE = process.env.NEXT_PUBLIC_E2E === '1';

export function TestModeHandler() {
  const searchParams = useSearchParams();
  const urlIndicatesTestMode = searchParams.get('testMode') === 'true';
  const testModeActive = useMemo(() => {
    const e2eFlag =
      typeof window !== 'undefined' && (window as Window & { __PW_E2E__?: boolean }).__PW_E2E__;
    return IS_ENV_TEST_MODE || urlIndicatesTestMode || Boolean(e2eFlag);
  }, [urlIndicatesTestMode]);

  useEffect(() => {
    if (testModeActive) {
      document.documentElement?.setAttribute('data-test-mode', 'true');
    } else {
      document.documentElement?.removeAttribute('data-test-mode');
    }
  }, [testModeActive]);

  return null;
}
