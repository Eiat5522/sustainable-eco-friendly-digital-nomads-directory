import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { AuthOptions } from "next-auth";
import clientPromise from "./mongodb";

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [], // Add providers as needed (e.g., Google, GitHub)
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    /**
     * JWT callback with type validation for token
     */
    async jwt({ token, user }) {
      if (typeof token !== 'object' || token === null || Array.isArray(token)) {
        throw new TypeError('Token must be a non-null object');
      }
      if (user) {
        token.role = (user as any).role || 'user';
      }
      return token;
    },
    /**
     * Session callback with type validation for token
     */
    async session({ session, token }) {
      if ((typeof token !== 'object' || token === null || Array.isArray(token)) && token !== undefined && token !== null) {
        throw new TypeError('Token must be a non-null object or undefined/null');
      }
      if (token && session.user) {
        session.user.id = token.sub ?? "";
        (session.user as any).role = token.role || 'user';
      }
      return session;
    },
  },
};

export default authOptions;
