import 'server-only';

import type { Model } from 'mongoose';
import NextAuth, { type NextAuthConfig, type Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
// Use CommonJS-friendly deep imports to avoid ESM parsing issues in Jest
// Additional OAuth providers can be added here when their credentials are available.
import { createAuthAdapter } from '@/lib/auth/adapter';
import { isAdminEmail } from '@/lib/auth/config';
import { authenticateUserCredentials, getUserById } from '@/lib/auth/dal';
import { enforceLoginRateLimit, recordLoginAttempt } from '@/lib/auth/rateLimit';
import { getClientIp } from '@/lib/rate-limit';
import { syncUserToSanity } from '@/lib/auth/userService';
import dbConnect from '@/lib/dbConnect';
import { structuredLogger } from '@/lib/logger';
import User, { type IUser } from '@/models/User';
import type { UserRole } from '@/types/auth';
import type { HeadersLike } from '@/types/request';

// Central NextAuth configuration used by route handlers and auth() helper
// Build providers conditionally to avoid requiring unused env vars
type AppUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: UserRole;
  status?: string;
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
        const ip = getClientIp(request as Request);
        const identifier = ip !== 'unknown' ? `${email}:${ip}` : email;

        const rateLimit = await enforceLoginRateLimit(identifier);
        if (!rateLimit.success) {
          await recordLoginAttempt({ email, ip, success: false, reason: 'rate_limited' });
          throw new Error('Too many login attempts. Please try again later.');
        }

        const user = await authenticateUserCredentials(email, password);
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
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

const parseBooleanEnv = (value?: string): boolean => {
  if (!value) {
    return false;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const trustHostEnvRaw = process.env.AUTH_TRUST_HOST ?? process.env.NEXTAUTH_TRUST_HOST;
const trustHostEnv = trustHostEnvRaw === undefined ? undefined : parseBooleanEnv(trustHostEnvRaw);
const trustHostFallback =
  Boolean(
    process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXTAUTH_URL_INTERNAL ||
      process.env.VERCEL ||
      process.env.CF_PAGES
  ) || process.env.NODE_ENV !== 'production';
const shouldTrustHost = trustHostEnv ?? trustHostFallback;

if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

if (githubClientId && githubClientSecret) {
  providers.push(
    GitHub({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    })
  );
}

// Extend `providers` with any other OAuth options (Facebook, X/Twitter, Microsoft Entra ID, etc.)
// when their credentials are supplied in the environment.

const adapter = createAuthAdapter();

const callbacks = {
  async signIn({ user, account, profile }) {
    try {
      // Check if user is suspended in MongoDB
      const provider = account?.provider;
      const isCredentialsProvider = provider === 'credentials';
      const email = typeof user?.email === 'string' ? user.email.toLowerCase() : null;
      const shouldCheckDb = Boolean(email && provider && !isCredentialsProvider);
      if (shouldCheckDb) {
        await dbConnect();
        const dbUser = await UserModel.findOne({ email });
        if (dbUser?.status === 'suspended') {
          return false; // Block sign-in
        }
      }

      // Only apply to OAuth providers; credentials flow already enforces verification.
      if (shouldCheckDb) {
        // Note: rate-limit enforcement for OAuth verification callbacks
        // is intentionally omitted until the shared rate limiter is available.

        // Heuristics across providers
        const p = (profile ?? {}) as Record<string, unknown>;
        const isTrue = (v: unknown) => v === true;
        const isNotNullish = (v: unknown) => v != null;
        const oauthProvider = provider as string;
        const emailVerifiedHeuristic =
          isTrue(p['email_verified']) ||
          isTrue(p['verified_email']) ||
          isTrue(p['emailVerified']) ||
          isNotNullish(p['email_verified_at']) ||
          isTrue(p['verified']);
        const hasEmail = Boolean(email);
        const shouldVerify =
          // Google common flags
          (oauthProvider === 'google' && (emailVerifiedHeuristic || hasEmail)) ||
          // Facebook often provides email if permission granted; presence implies control
          (oauthProvider === 'facebook' && hasEmail) ||
          // X/Twitter only exposes email with elevated perms; if present assume control
          (oauthProvider === 'twitter' && ((p['email'] as string | undefined) || hasEmail)) ||
          // Microsoft Entra ID: if sign-in succeeded and email present, assume verified
          (oauthProvider === 'microsoft-entra-id' && hasEmail) ||
          // Fallback on explicit flags from any provider
          emailVerifiedHeuristic;
        if (shouldVerify && process.env.MONGODB_URI) {
          await UserModel.updateOne(
            {
              email,
              emailVerified: null,
            },
            { $set: { emailVerified: new Date() } },
            { maxTimeMS: 5000 }
          );
        }
      }
    } catch (error) {
      structuredLogger.warn('[auth] signIn verification sync failed', error, {
        component: 'auth',
      });
    }
    return true;
  },
  async jwt({ token, user, trigger }) {
    type AppToken = JWT & { id?: string; role?: UserRole; name?: string | null; status?: string };
    const t = token as unknown as AppToken;
    if (user) {
      const u = user as Partial<{
        id: string;
        role?: UserRole | null;
        name?: string | null;
        status?: string;
      }>;
      if (u.id) t.id = u.id;
      if (u.name) t.name = u.name;
      // Always prefer the DB canonical role and tokenVersion when available
      if (u.id) {
        const dbUser = await getUserById(String(u.id));
        if (dbUser) {
          t.role = dbUser.role;
          t.status = dbUser.status;
          (t as unknown as { tokenVersion?: number }).tokenVersion = dbUser.tokenVersion;
        } else if (u.role) {
          t.role = u.role;
        }
      } else if (u.role) {
        t.role = u.role;
      }
    } else if (t.id && trigger === 'update') {
      // Only fetch user data from DB when explicitly updating the session
      // This avoids unnecessary DB queries on every request
      const dbUser = await getUserById(String(t.id));
      if (dbUser) {
        t.name = dbUser.name;
        t.picture = dbUser.image;
        t.role = dbUser.role;
        t.status = dbUser.status;
        (t as unknown as { tokenVersion?: number }).tokenVersion = dbUser.tokenVersion;
      }
    }
    const email = (user as { email?: string | null })?.email ?? token.email;
    ensureAllowlistedAdminPromotionFlow({
      email,
      userId: t.id,
      currentRole: t.role ?? null,
    }).catch(error => {
      structuredLogger.error('[auth] failed to queue admin allowlist promotion flow', error, {
        component: 'auth',
        email,
      });
    });
    return t as JWT | null;
  },
  async session({ session, token, user }) {
    type WithAppUser = typeof session & {
      user: typeof session.user & {
        id?: string;
        role?: UserRole;
        status?: string;
        tokenVersion?: number;
      };
    };
    const s = session as WithAppUser;
    if (s.user) {
      if (user?.id) s.user.id = user.id;

      // Explicitly sync name and image from token to session user
      // This ensures client-side updates via update() are reflected immediately
      if (token?.name) s.user.name = token.name;
      if (token?.picture) s.user.image = token.picture;

      if (user?.role) {
        s.user.role = user.role;
      } else if (!user && token?.role) {
        s.user.role = token.role;
      } else {
        delete s.user.role;
      }

      if (token?.status) {
        s.user.status = token.status as string;
      }

      // surface tokenVersion in session for client-side checks if needed
      if (!user && (token as unknown as { tokenVersion?: number })?.tokenVersion !== undefined) {
        s.user.tokenVersion = (token as unknown as { tokenVersion?: number }).tokenVersion;
      }
      if (!user && token?.id) s.user.id = String(token.id);
      // Session roles are UI hints only. Protected server routes must re-verify
      // permissions against the database before authorising privileged actions.
    }
    return s;
  },
} as NextAuthConfig['callbacks'];
if (process.env.NODE_ENV !== 'production') {
  structuredLogger.debug('NextAuth Config:', { component: 'auth' });
  structuredLogger.debug('NEXTAUTH_SECRET (first 5 chars):', {
    component: 'auth',
    secretPreview: process.env.NEXTAUTH_SECRET?.substring(0, 5) ?? null,
  });
  structuredLogger.debug('NODE_ENV:', { component: 'auth', nodeEnv: process.env.NODE_ENV });
}
export const authOptions: NextAuthConfig = {
  // Use adapter only when a valid Mongo URI is configured to avoid dev crashes
  ...(adapter ? { adapter } : {}),
  basePath: '/api/auth',
  session: { strategy: 'jwt' },
  trustHost: shouldTrustHost,
  providers,
  pages: {
    signIn: '/auth/signin',
  },
  callbacks,
  events: {
    async signIn({ user }) {
      if (user?.email) {
        try {
          await dbConnect();
          // Update lastLogin in MongoDB
          await UserModel.updateOne(
            { email: user.email.toLowerCase() },
            { $set: { lastLogin: new Date() } }
          );

          // Sync to Sanity
          const dbUser = await UserModel.findOne({ email: user.email.toLowerCase() });
          if (dbUser) {
            const sanityUser = await syncUserToSanity({
              id: dbUser._id.toString(),
              email: dbUser.email,
              name: dbUser.name,
              image: dbUser.image,
              role: dbUser.role,
              status: dbUser.status,
              sanityId: dbUser.sanityId ?? null,
            });
            if (sanityUser?._id && dbUser.sanityId !== sanityUser._id) {
              await UserModel.updateOne(
                { _id: dbUser._id },
                { $set: { sanityId: sanityUser._id } }
              );
            }
          }
        } catch (error) {
          structuredLogger.error('[auth] Error in signIn event', error, {
            component: 'auth',
            email: user.email,
          });
        }
      }
    },
    async createUser({ user }) {
      if (user?.id || user?.email) {
        try {
          await dbConnect();
          const query = user.id ? { _id: user.id } : { email: user.email?.toLowerCase() };

          // Ensure default role and status are set in MongoDB (since adapter bypasses Mongoose defaults)
          await UserModel.updateOne(
            query,
            {
              $set: {
                role: 'user',
                status: 'active',
              },
              $setOnInsert: {
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            },
            { upsert: false }
          );

          const dbUser = await UserModel.findOne(query);
          const role = dbUser?.role ?? ('role' in user ? (user.role as string) : 'user');
          if (dbUser) {
            const sanityUser = await syncUserToSanity({
              id: dbUser._id.toString(),
              email: dbUser.email,
              name: dbUser.name ?? undefined,
              image: dbUser.image ?? undefined,
              role,
              status: dbUser.status ?? 'active',
              sanityId: dbUser.sanityId ?? null,
            });
            if (sanityUser?._id && dbUser.sanityId !== sanityUser._id) {
              await UserModel.updateOne(
                { _id: dbUser._id },
                { $set: { sanityId: sanityUser._id } }
              );
            }
          }
        } catch (error) {
          structuredLogger.error('[auth] Error in createUser event', error, {
            component: 'auth',
            email: user.email,
          });
        }
      }
    },
  },
};

const nextAuthInstance = (() => {
  try {
    const inst = NextAuth(authOptions);
    return inst;
  } catch (err) {
    structuredLogger.warn(
      '[auth] NextAuth initialization failed (build/prerender), using stub instance',
      err,
      {
        component: 'auth',
      }
    );
    // Provide a minimal stub that mirrors the shape used elsewhere: handlers and
    // an `auth` helper that returns null during build-time so callers can handle
    // unauthenticated flows instead of crashing.
    return {
      handlers: {
        GET: async (_request?: Request) => new Response(''),
        POST: async (_request?: Request) => new Response(''),
      },
      auth: async () => null,
    } as {
      handlers: {
        GET: (request: Request) => Promise<Response>;
        POST: (request: Request) => Promise<Response>;
      };
      auth: () => Promise<null>;
    };
  }
})();

export const {
  handlers: { GET, POST },
} = nextAuthInstance as {
  handlers: {
    GET: (request: Request) => Promise<Response>;
    POST: (request: Request) => Promise<Response>;
  };
};

// Wrap the original `auth` export to guard against `headers()` rejections
// that can occur during prerendering. If `headers()` rejects (which the
// Next.js runtime surfaces as an Error during prerender), return `null`
// so callers can handle unauthenticated flows instead of crashing the
// prerender process.
const _originalAuth = (nextAuthInstance as { auth: (...args: unknown[]) => Promise<unknown> }).auth;

// Accept an optional headers-like parameter for API consistency with other
// helpers, but auth() itself doesn't use it - it accesses headers internally.
// The headersParam is primarily documentation that the caller is in a request
// context and has headers available for other request-scoped helpers.
export async function auth(
  _headersParam?: HeadersLike | null,
  ...args: unknown[]
): Promise<Session | null> {
  try {
    // Note: NextAuth's auth() doesn't accept headers as a parameter.
    // It internally calls headers() when needed. The headersParam above
    // is for consistency with other helpers and to document that callers
    // are in request context. We don't pass it to _originalAuth.
    // If additional args are provided (for other use cases), pass them through.
    return (await _originalAuth(...args)) as Session | null;
  } catch (error) {
    try {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('headers()') || msg.includes('During prerendering')) {
        // Log at debug level since this is expected behavior during prerendering
        // Using debug instead of info to avoid cluttering build output
        structuredLogger.debug('[auth] headers() unavailable during prerender, returning null', {
          component: 'auth',
        });
        return null;
      }
    } catch {
      // Fall through to rethrow the original error below if we can't inspect it.
    }
    structuredLogger.error('[auth] auth() helper error', error, { component: 'auth' });
    throw error;
  }
}

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
  if (globalThis.window !== undefined) {
    throw new TypeError('Admin allowlist checks must never run on the client runtime');
  }

  if (!email || !userId) return;
  const normalisedEmail = email.trim().toLowerCase();
  if (!isAdminEmail(normalisedEmail)) return;
  if (currentRole === 'admin') return;
}
