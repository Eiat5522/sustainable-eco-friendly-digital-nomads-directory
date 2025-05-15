import NextAuth, { NextAuthOptions, Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import GoogleProvider, { GoogleProfile } from 'next-auth/providers/google';
import GithubProvider, { GithubProfile } from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { Account, Profile } from 'next-auth';
import clientPromise from "@/lib/mongodb";
import bcrypt from 'bcryptjs';
import { createSanityUser, findSanityUserByEmail, updateSanityUserWithAuthDetails } from '@/lib/auth/userService';
import { createHash } from 'crypto';

export const authOptions: NextAuthOptions = {
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
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 4 * 60 * 60, // 4 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async signIn({ 
      user,
      account,
      profile,
    }: {
      user: User;
      account: Account | null;
      profile?: Profile;
    }) {
      // Rate limiting
      if (account?.type === 'credentials') {
        const client = await clientPromise;
        const db = client.db();
        
        // Check login attempts
        const attempts = await db.collection('loginAttempts').findOne({
          email: user.email,
          createdAt: { $gt: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
        });

        if (attempts && attempts.count >= 5) {
          throw new Error('Too many login attempts. Please try again later.');
        }

        // Record attempt
        await db.collection('loginAttempts').updateOne(
          { email: user.email },
          {
            $inc: { count: 1 },
            $setOnInsert: { createdAt: new Date() }
          },
          { upsert: true }
        );
      }

      // Sync with Sanity
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
        }
      }
      return true;
    },

    async jwt({ 
      token,
      user,
      account,
    }: {
      token: JWT;
      user?: User;
      account?: Account | null;
    }) {
      if (user) {
        token.role = user.role || 'user';
        token.id = user.id;
        
        if (account?.refresh_token) {
          token.refreshTokenHash = createHash('sha256')
            .update(account.refresh_token)
            .digest('hex');
        }
        
        token.createdAt = Date.now();
      }

      if (token.createdAt && Date.now() - token.createdAt > 4 * 60 * 60 * 1000) {
        token.createdAt = Date.now();
      }

      return token;
    },

    async session({ 
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        delete session.user.email;
        session.expires = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString();
      }
      return session;
    },
  },
  events: {
    async signOut({ token }: { token: JWT }) {
      if (token?.email) {
        const client = await clientPromise;
        const db = client.db();
        await db.collection('loginAttempts').deleteMany({ email: token.email });
      }
    },
    async createUser({ user }: { user: User }) {
      console.log(`User created: ${user.id}`);
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
