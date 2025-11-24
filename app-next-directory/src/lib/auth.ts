import 'server-only';
import type { Model } from 'mongoose';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
// Use CommonJS-friendly deep imports to avoid ESM parsing issues in Jest
// Additional OAuth providers can be added here when their credentials are available.
import { createAuthAdapter } from '@/lib/auth/adapter';
import { isAdminEmail } from '@/lib/auth/config';
import { enforceLoginRateLimit, recordLoginAttempt } from '@/lib/auth/rateLimit';
import { authenticateUser, getUserById } from '@/lib/auth/serverAuth';
import dbConnect from '@/lib/dbConnect';
import User, { type IUser } from '@/models/User';
import type { UserRole } from '@/types/auth';

// Central NextAuth configuration used by route handlers and auth() helper
// Build providers conditionally to avoid requiring unused env vars
type AppUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
};

const UserModel = User as unknown as Model<IUser>;

const providers: NextAuthConfig['providers'] = [
  Credentials({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials, request) {
      try {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).trim().toLowerCase();
        const password = String(credentials.password);
        const forwardedFor =
          request?.headers?.get('x-forwarded-for') ?? request?.headers?.get('x-real-ip') ?? '';
        const ip = forwardedFor.split(',')[0]?.trim() || null;
        const identifier = ip ? `${email}:${ip}` : email;

        const rateLimit = await enforceLoginRateLimit(identifier);
        if (!rateLimit.success) {
          await recordLoginAttempt({ email, ip, success: false, reason: 'rate_limited' });
          throw new Error('Too many login attempts. Please try again later.');
        }

        const user = await authenticateUser(email, password);
        await recordLoginAttempt({
          email,
          ip,
          success: Boolean(user),
          reason: user ? 'success' : 'invalid_credentials',
        });

        if (!user) return null;
        const result: AppUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
        return result;
      } catch (error) {
        // Avoid leaking internal error details during auth
        if (error instanceof Error && error.message.startsWith('Too many login attempts')) {
          throw error;
        }
        return null;
      }
    },
  }),
];

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

// Extend `providers` with any other OAuth options (Facebook, X/Twitter, Microsoft Entra ID, etc.)
// when their credentials are supplied in the environment.

const adapter = createAuthAdapter();

const callbacks = {
  async signIn({ user, account, profile }) {
    try {
      // Only apply to OAuth providers; credentials flow already enforces verification.
      if (account?.provider && account.provider !== 'credentials' && user?.email) {
        // TODO(auth): Reinstate rate-limit enforcement for OAuth verification
        // callbacks once the shared rate limiter is ready for this flow.

        // Heuristics across providers
        const p = (profile ?? {}) as Record<string, unknown>;
        const isTrue = (v: unknown) => v === true;
        const isNotNullish = (v: unknown) => v != null;
        const provider = account.provider;
        const emailVerifiedHeuristic =
          isTrue(p['email_verified']) ||
          isTrue(p['verified_email']) ||
          isTrue(p['emailVerified']) ||
          isNotNullish(p['email_verified_at']) ||
          isTrue(p['verified']);
        const hasEmail = Boolean(user.email);
        const shouldVerify =
          // Google common flags
          (provider === 'google' && (emailVerifiedHeuristic || hasEmail)) ||
          // Facebook often provides email if permission granted; presence implies control
          (provider === 'facebook' && hasEmail) ||
          // X/Twitter only exposes email with elevated perms; if present assume control
          (provider === 'twitter' && ((p['email'] as string | undefined) || hasEmail)) ||
          // Microsoft Entra ID: if sign-in succeeded and email present, assume verified
          (provider === 'microsoft-entra-id' && hasEmail) ||
          // Fallback on explicit flags from any provider
          emailVerifiedHeuristic;
        if (shouldVerify && process.env.MONGODB_URI) {
          await dbConnect();
          await UserModel.updateOne(
            {
              email: String(user.email).toLowerCase(),
              emailVerified: null,
            },
            { $set: { emailVerified: new Date() } },
            { maxTimeMS: 5000 }
          );
        }
      }
    } catch (error) {
    }
    return true;
  },
  async jwt({ token, user, trigger }) {
    type AppToken = JWT & { id?: string; role?: UserRole; name?: string | null };
    const t = token as unknown as AppToken;
    if (user) {
      const u = user as Partial<{ id: string; role?: UserRole | null; name?: string | null }>;
      if (u.id) t.id = u.id;
      if (u.name) t.name = u.name;
      if (u.role) {
        t.role = u.role;
      }
    } else if (t.id && trigger === 'update') {
      // Only fetch user data from DB when explicitly updating the session
      // This avoids unnecessary DB queries on every request
      const dbUser = await getUserById(String(t.id));
      if (dbUser) {
        t.name = dbUser.name;
        t.role = dbUser.role;
      }
    }
    const email = (user as { email?: string | null })?.email ?? token.email;
    ensureAllowlistedAdminPromotionFlow({
      email,
      userId: t.id,
      currentRole: t.role ?? null,
    }).catch(error => {
    });
    return t as JWT | null;
  },
  async session({ session, token, user }) {
    type WithAppUser = typeof session & {
      user: typeof session.user & { id?: string; role?: UserRole };
    };
    const s = session as WithAppUser;
    if (s.user) {
      if (user?.id) s.user.id = user.id;
      if (user?.role) {
        s.user.role = user.role as UserRole;
      } else if (!user && token?.role) {
        s.user.role = token.role as UserRole;
      } else {
        delete s.user.role;
      }
      if (!user && token?.id) s.user.id = String(token.id);
      // Session roles are UI hints only. Protected server routes must re-verify
      // permissions against the database before authorising privileged actions.
    }
    return s;
  },
} as NextAuthConfig['callbacks'];

export const authOptions: NextAuthConfig = {
  // Use adapter only when a valid Mongo URI is configured to avoid dev crashes
  ...(adapter ? { adapter } : {}),
  session: { strategy: 'jwt' },
  providers,
  pages: {
    signIn: '/auth/login',
  },
  callbacks,
};

const nextAuthInstance = (() => {
  const inst = NextAuth(authOptions);
  return inst;
})();

export const {
  handlers: { GET, POST },
  auth,
} = nextAuthInstance;

// Export getToken for middleware and tests
export { getToken } from 'next-auth/jwt';

type AllowlistedAdminPromotionContext = {
  email?: string | null;
  userId?: string;
  currentRole?: UserRole | null;
};

async function ensureAllowlistedAdminPromotionFlow({
  email,
  userId,
  currentRole,
}: AllowlistedAdminPromotionContext): Promise<void> {
  if (typeof window !== 'undefined') {
    throw new Error('Admin allowlist checks must never run on the client runtime');
  }

  if (!email || !userId) return;
  const normalisedEmail = email.trim().toLowerCase();
  if (!isAdminEmail(normalisedEmail)) return;
  if (currentRole === 'admin') return;
}
