import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { AuthOptions } from "next-auth";
import clientPromise from "./mongodb";

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  secret: .local.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [], // Add providers as needed (e.g., Google, GitHub)
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub;
        (session.user as any).role = token.role || 'user';
      }
      return session;
    },
  },
};

export default authOptions;
