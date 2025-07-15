import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { createHash } from 'crypto';
import NextAuth, { Account, NextAuthOptions, User as NextAuthUser, Profile, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';

// Import types and utilities
import clientPromise from "@/lib/mongodb";
import { UserRole } from '@/types/auth';

// Import server-side utilities (these will only run in API routes, not Edge)
import { authenticateUser } from '@/lib/auth/serverAuth';
import { createSanityUser, findSanityUserByEmail, updateSanityUserWithAuthDetails } from '@/lib/auth/userService';

const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    collections: {
      Users: "nextauth_users", // Use different collection name to avoid conflicts
      Accounts: "nextauth_accounts",
      Sessions: "nextauth_sessions",
      VerificationTokens: "nextauth_verification_tokens"
    }
  }), // MongoDBAdapter uses the raw client promise
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
          role: 'user' as UserRole, // Cast to UserRole
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
          role: 'user' as UserRole, // Cast to UserRole
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
          // Use server-side authentication function (non-Edge compatible)
          const user = await authenticateUser(credentials.email, credentials.password);

          if (!user) {
            throw new Error('Invalid credentials');
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role as UserRole,
          };
        } catch (error: any) {
          console.error('Auth error:', error.message);
          throw new Error(error.message);
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
      user: NextAuthUser; // Use NextAuthUser type here
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
      if (user.email) {        try {
          const sanityUser = await findSanityUserByEmail(user.email);
          if (!sanityUser) {
            await createSanityUser({
              name: user.name || '',
              email: user.email,
              avatar: user.image || undefined,
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
      token: JWT & { id: string; role?: UserRole; };
      user?: NextAuthUser & { role?: UserRole }; // Add role to user type
      account?: Account | null;
    }) {
      if (user) {
        token.role = user.role || 'user'; // Access role directly
        token.id = user.id;

        if (account?.refresh_token) {
          token.refreshTokenHash = createHash('sha256')
            .update(account.refresh_token)
            .digest('hex');
        }

        token.createdAt = Date.now();
      }      if (token.createdAt && Date.now() - Number(token.createdAt) > 4 * 60 * 60 * 1000) {
        token.createdAt = Date.now();
      }

      return token;
    },    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT & { id: string; role?: UserRole }; // Add role to token type
    }) {
      if (session.user) {
        (session.user as any).role = token.role; // Assign role to session user
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
    async createUser({ user }: { user: NextAuthUser }) { // Use NextAuthUser type here
      console.log(`User created: ${user.id}`);
      // Potentially sync with Sanity here as well if not handled by signIn
      // This event fires after the user is created in the database by the adapter.
      if (user.email) {
        try {
          const sanityUser = await findSanityUserByEmail(user.email);
          if (!sanityUser) {
            await createSanityUser({
              name: user.name || '',
              email: user.email,
              avatar: user.image || undefined,
              // role: (user as any).role || 'user', // Get role from the user object if available
              role: 'user', // Default to 'user' or get from DB if adapter adds it
            });
          } else {
            // Optionally update Sanity user if they were a placeholder and now have an auth account
            await updateSanityUserWithAuthDetails(sanityUser._id, {
              name: user.name || sanityUser.name,
              avatar: user.image || sanityUser.avatar,
            });
          }
        } catch (error) {
          console.error('Error synchronizing new user with Sanity in createUser event:', error);
        }
      }
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
export { authOptions, handler as GET, handler as POST };
