"use client";

import { useEffect } from 'react';

export default function MswInit() {
  useEffect(() => {
    // Only start MSW in E2E/Playwright runs where explicitly enabled
    const enabled = process.env.NEXT_PUBLIC_E2E === '1' || (globalThis as any).__PW_E2E__;
    if (!enabled) return;

    (async () => {
      const { worker } = await import('../mocks/browser');
      try {
        await worker.start({ onUnhandledRequest: 'bypass' });
        // eslint-disable-next-line no-console
        console.log('[MSW] Browser worker started for Playwright tests');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[MSW] Failed to start worker:', e);
      }
    })();
  }, []);

  return null;
}

