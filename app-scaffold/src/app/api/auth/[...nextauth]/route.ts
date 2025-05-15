import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import bcrypt from 'bcryptjs';
import { createSanityUser, findSanityUserByEmail, updateSanityUserWithAuthDetails } from '@/lib/auth/userService';

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'user',
        };
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          role: 'user',
        };
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        try {
          // Find user in MongoDB
          const client = await clientPromise;
          const db = client.db();
          const user = await db.collection('users').findOne({ email: credentials.email });

          if (!user || !user.password) {
            throw new Error('User not found or account uses social login');
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error('Invalid credentials');
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role || 'user',
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Create or update Sanity user when signing in
      if (user.email) {
        try {
          const sanityUser = await findSanityUserByEmail(user.email);
          
          if (!sanityUser) {
            await createSanityUser({
              name: user.name,
              email: user.email,
              avatar: user.image,
              role: 'user',
            });
          } else {
            await updateSanityUserWithAuthDetails(sanityUser._id, {
              name: user.name || sanityUser.name,
              avatar: user.image || sanityUser.avatar,
            });
          }
        } catch (error) {
          console.error('Error synchronizing with Sanity:', error);
          // Continue sign in even if Sanity update fails
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      // Add user role to the token
      if (user) {
        token.role = user.role || 'user';
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user role to the client-side session
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
