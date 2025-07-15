'use client';

import { SessionProvider } from "@auth/nextjs/react";

export default function SessionWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
