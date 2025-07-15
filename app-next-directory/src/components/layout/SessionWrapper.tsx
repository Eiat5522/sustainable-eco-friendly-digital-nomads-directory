'use client';

import { SessionProvider } from '@auth/nextjs';

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
