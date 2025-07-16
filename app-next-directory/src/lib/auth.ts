import NextAuth from "next-auth";
const NextAuthDefault = (NextAuth as any).default ?? NextAuth;
import type { NextAuthConfig } from "next-auth";

export const authOptions: NextAuthConfig = {
  providers: [],
};

export const { handlers: { GET, POST }, auth } = NextAuthDefault(authOptions);
