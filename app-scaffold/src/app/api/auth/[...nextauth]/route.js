import NextAuth from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';

const handler = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    // Add your providers here
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, user }) {
      return session;
    },
    async jwt({ token, user }) {
      return token;
    },
  },
});

export { handler as GET, handler as POST };
