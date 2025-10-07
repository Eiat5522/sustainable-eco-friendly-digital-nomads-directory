import 'server-only'
import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
// Use CommonJS-friendly deep imports to avoid ESM parsing issues in Jest
// import Google from 'next-auth/providers/google'
// import Facebook from 'next-auth/providers/facebook'
// import Twitter from 'next-auth/providers/twitter'
// import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import { createAuthAdapter } from '@/lib/auth/adapter'
import { authenticateUser, getUserById } from '@/lib/auth/serverAuth'
import { enforceLoginRateLimit, recordLoginAttempt } from '@/lib/auth/rateLimit'
import dbConnect from '@/lib/dbConnect'
import User from '@/models/User'
import type { JWT } from 'next-auth/jwt'
import type { UserRole } from '@/types/auth'
import { isAdminEmail } from '@/lib/auth/config'

// Central NextAuth configuration used by route handlers and auth() helper
// Build providers conditionally to avoid requiring unused env vars
type AppUser = { id: string; name?: string | null; email?: string | null; image?: string | null; role?: UserRole }

const providers: NextAuthConfig['providers'] = [
  Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        try {
          if (!credentials?.email || !credentials?.password) return null

          const email = String(credentials.email).trim().toLowerCase()
          const password = String(credentials.password)
          const forwardedFor = request?.headers?.get('x-forwarded-for') ?? request?.headers?.get('x-real-ip') ?? ''
          const ip = forwardedFor.split(',')[0]?.trim() || null
          const identifier = ip ? `${email}:${ip}` : email

          const rateLimit = await enforceLoginRateLimit(identifier)
          if (!rateLimit.success) {
            await recordLoginAttempt({ email, ip, success: false, reason: 'rate_limited' })
            throw new Error('Too many login attempts. Please try again later.')
          }

          const user = await authenticateUser(email, password)
          await recordLoginAttempt({
            email,
            ip,
            success: Boolean(user),
            reason: user ? 'success' : 'invalid_credentials',
          })

          if (!user) return null
          const result: AppUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          }
          return result
        } catch (_err) {
          // Avoid leaking internal error details during auth
          if (_err instanceof Error && _err.message.startsWith('Too many login attempts')) {
            throw _err
          }
          return null
        }
      },
  }),
]

// Temporarily disable OAuth providers until their credentials are configured.
// if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
//   providers.push(
//     Google({
//       clientId: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     })
//   )
// }

// if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
//   providers.push(
//     Facebook({
//       clientId: process.env.FACEBOOK_CLIENT_ID,
//       clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
//     })
//   )
// }

// if (process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET) {
//   providers.push(
//     Twitter({
//       clientId: process.env.X_CLIENT_ID,
//       clientSecret: process.env.X_CLIENT_SECRET,
//     })
//   )
// }

// if (process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET) {
//   providers.push(
//     MicrosoftEntraID({
//       name: 'Microsoft',
//       clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
//       clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
//        // tenantId removed to satisfy NextAuth v5 typings; default 'common' used by provider internally if needed
//     })
//   )
// }

const adapter = createAuthAdapter();

const callbacks = {
    async signIn({ user, account, profile }) {
      try {
        // Only apply to OAuth providers; credentials flow already enforces verification.
        if (account?.provider && account.provider !== 'credentials' && user?.email) {
        // Rate limit check (implement based on your rate limiting strategy)
        // if (await isRateLimited(user.email)) {
        //   console.warn('[auth] Rate limit hit for email verification', user.email);
        //   return true;
        // }

          // Heuristics across providers
          const p = (profile ?? {}) as Record<string, unknown>;
          const isTrue = (v: unknown) => v === true;
          const isNotNullish = (v: unknown) => v != null;
          const provider = account.provider;
          const emailVerifiedHeuristic = (
            isTrue(p['email_verified']) ||
            isTrue(p['verified_email']) ||
            isTrue(p['emailVerified']) ||
            isNotNullish(p['email_verified_at']) ||
            isTrue(p['verified'])
          );
          const hasEmail = Boolean(user.email);
          const shouldVerify = (
            // Google common flags
            (provider === 'google' && (emailVerifiedHeuristic || hasEmail)) ||
            // Facebook often provides email if permission granted; presence implies control
            (provider === 'facebook' && hasEmail) ||
            // X/Twitter only exposes email with elevated perms; if present assume control
            (provider === 'twitter' && ((p['email'] as string | undefined) || hasEmail)) ||
            // Microsoft Entra ID: if sign-in succeeded and email present, assume verified
            (provider === 'microsoft-entra-id' && hasEmail) ||
            // Fallback on explicit flags from any provider
            emailVerifiedHeuristic
          );
          if (shouldVerify && process.env.MONGODB_URI) {
            await dbConnect();
            // Use proper typing if available
            await User.updateOne(
              {
                email: String(user.email).toLowerCase(),
                emailVerified: null,
              },
              { $set: { emailVerified: new Date() } },
              { maxTimeMS: 5000 }
            );
          }
        }
      } catch (e) {
        // Swallow errors to not block sign-in; logging only
        console.warn('[auth] signIn verification sync failed', e);
      }
      return true;
    },
    async jwt({ token, user }) {
      type AppToken = JWT & { id?: string; role?: UserRole; name?: string | null }
      const t = token as unknown as AppToken
      if (user) {
        const u = user as Partial<{ id: string; role?: UserRole | null; name?: string | null }>
        if (u.id) t.id = u.id
        if (u.name) t.name = u.name
        if (u.role) {
          t.role = u.role
        }
      } else if (t.id) {
        // If user is not present (e.g., on session update without explicit user object),
        // fetch the latest user data from the database to ensure name is up-to-date.
        const dbUser = await getUserById(String(t.id));
        if (dbUser) {
          t.name = dbUser.name;
          t.role = dbUser.role;
        }
      }
      const email = (user as { email?: string | null })?.email ?? token.email
      ensureAllowlistedAdminPromotionFlow({
        email,
        userId: t.id,
        currentRole: t.role ?? null,
      }).catch((err) => {
        console.error('[auth] failed to queue admin allowlist promotion flow', err)
      })
      return t as JWT | null
    },
    async session({ session, token, user }) {
      type WithAppUser = typeof session & { user: (typeof session.user) & { id?: string; role?: UserRole } }
      const s = session as WithAppUser
      if (s.user) {
        if (user?.id) s.user.id = user.id
        if (user?.role) {
          s.user.role = user.role as UserRole
        } else if (!user && token?.role) {
          s.user.role = token.role as UserRole
        } else {
          delete s.user.role
        }
        if (!user && token?.id) s.user.id = String(token.id)
        // Session roles are UI hints only. Protected server routes must re-verify
        // permissions against the database before authorising privileged actions.
      }
      return s
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
}

const nextAuthInstance = (() => {
  try {
    const inst = NextAuth(authOptions);
    console.log('[auth] NextAuth initialized');
    return inst;
  } catch (err) {
    console.error('[auth] NextAuth initialization error', err);
    throw err;
  }
})();

export const { handlers: { GET, POST }, auth } = nextAuthInstance;

// Export getToken for middleware and tests
export { getToken } from 'next-auth/jwt'

type AllowlistedAdminPromotionContext = {
  email?: string | null
  userId?: string
  currentRole?: UserRole | null
}

async function ensureAllowlistedAdminPromotionFlow({
  email,
  userId,
  currentRole,
}: AllowlistedAdminPromotionContext): Promise<void> {
  if (typeof window !== 'undefined') {
    throw new Error('Admin allowlist checks must never run on the client runtime')
  }

  if (!email || !userId) return
  const normalisedEmail = email.trim().toLowerCase()
  if (!isAdminEmail(normalisedEmail)) return
  if (currentRole === 'admin') return

  // TODO: integrate with a step-up authentication gate and audit log capture before
  // issuing any elevated privileges. The promotion flow must update User.role within
  // the database and emit a security audit trail before short-lived admin sessions
  // are minted.
  console.info('[auth] allowlisted admin email detected; promotion flow required', {
    userId,
    email: normalisedEmail,
  })
}
