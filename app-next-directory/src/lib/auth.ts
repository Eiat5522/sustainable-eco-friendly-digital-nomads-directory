import 'server-only'
import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
// Use CommonJS-friendly deep imports to avoid ESM parsing issues in Jest
import Google from '@auth/core/providers/google'
import Facebook from '@auth/core/providers/facebook'
import Twitter from '@auth/core/providers/twitter'
import MicrosoftEntraID from '@auth/core/providers/microsoft-entra-id'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import clientPromise from '@/lib/mongodb'
import { authenticateUser } from '@/lib/auth/serverAuth'
import type { JWT } from 'next-auth/jwt'

// Central NextAuth configuration used by route handlers and auth() helper
// Build providers conditionally to avoid requiring unused env vars
const providers: NextAuthConfig['providers'] = [
  Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null
          const user = await authenticateUser(credentials.email, credentials.password)
          if (!user) return null
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image,
          } as any
        } catch (_err) {
          // Avoid leaking internal error details during auth
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
      tenantId: process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID ?? 'common',
    })
  )
}

export const authOptions: NextAuthConfig = {
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: 'jwt' },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      type AppToken = JWT & { id?: string; role?: string }
      const t = token as AppToken
      if (user) {
        const u = user as Partial<{ id: string; role?: string }>
        if (u.id) t.id = u.id
        if (u.role) t.role = u.role
      }
      return t
    },
    async session({ session, token }) {
      type WithAppUser = typeof session & { user: (typeof session.user) & { id?: string; role?: string } }
      const s = session as WithAppUser
      const t = token as Partial<{ id: string; role?: string }>
      if (s.user) {
        if (t.id) s.user.id = t.id
        if (t.role) s.user.role = t.role
      }
      return s
    },
  },
}

export const { handlers: { GET, POST }, auth } = NextAuth(authOptions)

// Export getToken for middleware and tests
export { getToken } from 'next-auth/jwt'
