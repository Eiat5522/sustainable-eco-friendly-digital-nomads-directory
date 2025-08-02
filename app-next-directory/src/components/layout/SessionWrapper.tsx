'use client';

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SessionWrapperProps {
  children: ReactNode;
  session?: any;
}

/**
 * Wrapper component to provide NextAuth session context to the app
 */
export default function SessionWrapper({ children, session }: SessionWrapperProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}
