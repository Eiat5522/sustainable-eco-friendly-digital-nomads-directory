
import NextAuth, { type NextAuthConfig } from "next-auth";

export const authOptions: NextAuthConfig = {
  providers: [],
};

export const { handlers: { GET, POST }, auth } = NextAuth(authOptions);

// Export getToken for middleware and tests
export { getToken } from "next-auth/jwt";
