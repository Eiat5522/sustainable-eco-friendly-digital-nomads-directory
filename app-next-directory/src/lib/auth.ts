import NextAuth from "next-auth";
import { NextAuthConfig } from "next-auth";

export const authOptions: NextAuthConfig = {
  providers: [],
};

export const { handlers: { GET, POST }, auth } = NextAuth(authOptions);
