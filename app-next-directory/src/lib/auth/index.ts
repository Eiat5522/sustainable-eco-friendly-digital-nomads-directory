import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createAuthAdapter } from './adapter';
import { authenticateUser } from './serverAuth';
import { enforceLoginRateLimit, recordLoginAttempt } from './rateLimit';
import dbConnect from '../dbConnect';
import User from '../../models/User';
import { isAdminEmail } from './config';
import type { UserRole } from '../../types/auth';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials, req) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const ip =
          req.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          req.headers?.get('x-real-ip') ||
          'unknown';
        try {
          await enforceLoginRateLimit(`${credentials.email}:${ip}`);
          const user = await authenticateUser(credentials.email, credentials.password);
          if (user) {
            await recordLoginAttempt({
              email: credentials.email,
              ip,
              success: true,
              reason: 'success',
            });
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              image: user.image,
            };
          } else {
            await recordLoginAttempt({
              email: credentials.email,
              ip,
              success: false,
              reason: 'invalid_credentials',
            });
            return null;
          }
        } catch (error) {
          if (error.message === 'Too many login attempts. Please try again later.') {
            await recordLoginAttempt({
              email: credentials.email,
              ip,
              success: false,
              reason: 'rate_limited',
            });
            throw error;
          }
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  adapter: createAuthAdapter(),
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      if (account?.provider === 'credentials') {
        return true;
      }
      if (account?.provider && profile?.email_verified && process.env.MONGODB_URI) {
        try {
          await dbConnect();
          await User.updateOne(
            { email: user.email, emailVerified: null },
            { $set: { emailVerified: new Date() } },
            { maxTimeMS: 5000 }
          );
        } catch (error) {
          console.error('Error updating email verification:', error);
        }
      }
      return true;
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Admin check is performed but role assignment is handled elsewhere if needed
        isAdminEmail(user.email);
      }
      return token;
    },
    session: async ({ session, token, user }) => {
      if (user) {
        session.user.id = user.id;
        session.user.role = user.role;
      } else if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      } else {
        delete session.user.role;
      }
      return session;
    },
  },
};
