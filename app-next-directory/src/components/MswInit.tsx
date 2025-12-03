'use client';

import { useEffect } from 'react';
import { structuredLogger } from '@/lib/logger';

export default function MswInit() {
  useEffect(() => {
    // Only start MSW in E2E/Playwright runs where explicitly enabled
    const enabled =
      process.env.NEXT_PUBLIC_E2E === '1' || (globalThis as { __PW_E2E__?: boolean }).__PW_E2E__;
    if (!enabled) return;

    (async () => {
      const { worker } = await import('../mocks/browser');
      try {
        await worker.start({ onUnhandledRequest: 'bypass' });
        structuredLogger.info('[MSW] Browser worker started for Playwright tests', {
          component: 'msw',
        });
      } catch (e) {
        structuredLogger.warn('[MSW] Failed to start worker', {
          component: 'msw',
          err: e instanceof Error ? e.message : undefined,
        });
      }
    })();
  }, []);

  return null;
}
