import { SessionProvider } from "next-auth/react";
import React from "react";
import { MainNav } from "@/components/layout/MainNav";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <MainNav />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
