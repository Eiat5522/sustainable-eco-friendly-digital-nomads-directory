"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/clientAuth";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  );
}
