import 'server-only'
import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
// Use CommonJS-friendly deep imports to avoid ESM parsing issues in Jest
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'
import Twitter from 'next-auth/providers/twitter'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import { createAuthAdapter } from '@/lib/auth/adapter'
import { authenticateUser } from '@/lib/auth/serverAuth'
import { enforceLoginRateLimit, recordLoginAttempt } from '@/lib/auth/rateLimit'
import dbConnect from '@/lib/dbConnect'
import User from '@/models/User'
import type { JWT } from 'next-auth/jwt'
import type { UserRole } from '@/types/auth'

// Central NextAuth configuration used by route handlers and auth() helper
// Build providers conditionally to avoid requiring unused env vars
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
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
          } as any
        } catch (_err) {

          // Avoid leaking internal error details during auth          if (_err instanceof Error && _err.message.startsWith('Too many login attempts')) {
            throw _err
          }
          return null
        }
      },
    }) as any,
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    })
  )
}

if (process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET) {
  providers.push(
    Twitter({
      clientId: process.env.X_CLIENT_ID,
      clientSecret: process.env.X_CLIENT_SECRET,
    })
  )
}

if (process.env.AUTH_MICROSOFT_ENTRA_ID_ID && process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET) {
  providers.push(
    MicrosoftEntraID({
      name: 'Microsoft',
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
       // tenantId removed to satisfy NextAuth v5 typings; default 'common' used by provider internally if needed
    })
  )
}

const adapter = createAuthAdapter();

export const authOptions: NextAuthConfig = {
  // Use adapter only when a valid Mongo URI is configured to avoid dev crashes
  ...(adapter ? { adapter } : {}),
  session: { strategy: 'jwt' },
  providers,
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
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
          const p: any = profile || {};
          const provider = account.provider;
          const emailVerifiedHeuristic = (
            p.email_verified === true ||
            p.verified_email === true ||
            p.emailVerified === true ||
            p.email_verified_at != null ||
            p.verified === true
          );
          const hasEmail = Boolean(user.email);
          const shouldVerify = (
            // Google common flags
            (provider === 'google' && (emailVerifiedHeuristic || hasEmail)) ||
            // Facebook often provides email if permission granted; presence implies control
            (provider === 'facebook' && hasEmail) ||
            // X/Twitter only exposes email with elevated perms; if present assume control
            (provider === 'twitter' && (p.email || hasEmail)) ||
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
      type AppToken = JWT & { id?: string; role?: UserRole }
      const t = token as AppToken
      if (user) {
        const u = user as Partial<{ id: string; role?: string }>
        if (u.id) t.id = u.id
        if (u.role) t.role = u.role as UserRole
      }
      return t
    },
    async session({ session, token, user }) {
      type WithAppUser = typeof session & { user: (typeof session.user) & { id?: string; role?: UserRole } }
      const s = session as WithAppUser
      if (s.user) {
        if (user?.id) s.user.id = user.id
        if (user?.role) s.user.role = user.role as UserRole
        if (!user && token?.id) s.user.id = String(token.id)
        if (!user && token?.role) s.user.role = token.role as UserRole
      }
      return s
    },
  },
}

export const { handlers: { GET, POST }, auth } = NextAuth(authOptions)

// Export getToken for middleware and tests
export { getToken } from 'next-auth/jwt'
