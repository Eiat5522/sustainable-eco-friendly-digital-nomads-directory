"use client";

import { SessionProvider } from "next-auth/react";
import type { StrictComponent } from "@/types";
import { AuthProvider } from "@/lib/auth/clientAuth";

const Providers: StrictComponent = ({ children }) => {
  return (
    <SessionProvider>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  );
};

export default Providers;
