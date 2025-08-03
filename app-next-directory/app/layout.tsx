import { SessionProvider } from "next-auth/react";
import React from "react";
import { MainNav } from "@/components/layout/MainNav";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <MainNav />
          {children}
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
