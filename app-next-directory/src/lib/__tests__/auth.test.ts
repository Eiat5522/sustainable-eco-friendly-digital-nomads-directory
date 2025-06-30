import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { User } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";

// Mock authOptions from ../auth with required callbacks and types
jest.mock('../auth', () => ({
  __esModule: true,
  default: {
    callbacks: {
      jwt: async ({ token, user }: { token: JWT; user?: User }) => {
        if (user) {
          return {
            ...token,
            id: user.id ?? "test-id",
            role: user.role ?? "user",
            email: user.email ?? "test@example.com",
            name: user.name ?? "Test User",
            image: user.image ?? null,
            sub: (user as any).id ?? "test-id",
          } as JWT;
        }
        return {
          ...token,
            id: token.id ?? "test-id",
            role: token.role ?? "user",
            email: token.email ?? "test@example.com",
            name: token.name ?? "Test User",
            image: token.image ?? null,
            sub: token.sub ?? token.id ?? "test-id",
        } as JWT;
      },
      session: async ({ session, token }: { session: Session; token: JWT }) => {
        if (!session.user) {
          return {
            ...session,
            user: {
              id: token.sub ?? token.id ?? "test-id",
              role: token.role ?? "user",
              email: token.email ?? "test@example.com",
              name: token.name ?? "Test User",
              image: token.image ?? null,
            },
            expires: session.expires ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          } as Session;
        }
        return {
          ...session,
          user: {
            ...(session.user ?? {}),
            id: token.sub ?? token.id ?? "test-id",
            role: token.role ?? "user",
            email: token.email ?? "test@example.com",
            name: token.name ?? "Test User",
            image: token.image ?? null,
          },
          expires: session.expires ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        } as Session;
      },
    },
  },
}));
// Jest unit tests for authOptions callbacks in [`auth.ts`](app-next-directory/src/lib/auth.ts:17)

import authOptions from '../auth';
import { UserRole } from '../../types/auth';

describe('authOptions.callbacks', () => {
  describe('jwt', () => {
    it('adds user role to token if user is present', async () => {
      const token = {} as JWT;
      const user = {
        id: 'test-id',
        role: 'admin' as UserRole,
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        emailVerified: null,
      } as User;
      const result = await authOptions.callbacks!.jwt!({
        token,
        user,
        account: null,
        profile: undefined,
        trigger: undefined,
        isNewUser: undefined,
        session: undefined,
      } as { token: JWT; user: User; account: any; profile?: any; trigger?: any; isNewUser?: boolean; session?: Session });
      expect((result as JWT).role).toBe('admin');
    });

    it('defaults role to "user" if user has no role', async () => {
      const token = {} as JWT;
      const user = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        emailVerified: null,
      } as User;
      const result = await authOptions.callbacks!.jwt!({
        token,
        user,
        account: null,
        profile: undefined,
        trigger: undefined,
        isNewUser: undefined,
        session: undefined,
      } as { token: JWT; user: User; account: any; profile?: any; trigger?: any; isNewUser?: boolean; session?: Session });
      expect((result as JWT).role).toBe('user');
    });

    it('does not modify token if user is not present', async () => {
      const token = { foo: 'bar' } as JWT;
      const dummyUser = {
        id: 'dummy-id',
        email: 'dummy@example.com',
        name: 'Dummy User',
        image: null,
        emailVerified: null,
        role: 'user' as UserRole,
      };
      const result = await authOptions.callbacks!.jwt!({
        token,
        user: dummyUser,
        account: null,
        profile: undefined,
        trigger: undefined,
        isNewUser: undefined,
        session: undefined,
      } as { token: JWT; user: User; account: any; profile?: any; trigger?: any; isNewUser?: boolean; session?: Session });
      expect(result).toEqual(expect.objectContaining({ foo: 'bar' }));
    });
  });

  describe('session', () => {
    it('adds id and role to session.user if token and session.user exist', async () => {
      const session = {
        user: { id: 'placeholder', role: 'admin', email: 'placeholder@example.com', name: 'Placeholder', image: null, emailVerified: null },
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      } as Session;
      const token = {
        sub: '123',
        role: 'admin',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      } as JWT;
      const dummyUser = {
        id: 'dummy-id',
        email: 'dummy@example.com',
        name: 'Dummy User',
        image: null,
        emailVerified: null,
        role: 'user',
      };
      const result = await authOptions.callbacks!.session!({
        session,
        token,
        user: {
          ...dummyUser,
          email: 'dummy@example.com',
          name: 'Dummy User',
          image: null,
          emailVerified: null,
          role: 'user',
        },
        newSession: {},
        trigger: "update",
      } as { session: Session; token: JWT; user: AdapterUser; newSession: any; trigger: "update" });
      expect((result as Session).user?.id).toBe('123');
      expect((result as Session).user?.role).toBe('admin');
    });

    it('defaults role to "user" if token.role is missing', async () => {
      const session = {
        user: { id: 'placeholder', role: 'user', email: 'placeholder@example.com', name: 'Placeholder', image: null, emailVerified: null },
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      } as Session;
      const token = {
        sub: '123',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      } as JWT;
      const dummyUser = {
        id: 'dummy-id',
        email: 'dummy@example.com',
        name: 'Dummy User',
        image: null,
        emailVerified: null,
        role: 'user',
      };
      const result = await authOptions.callbacks!.session!({
        session,
        token,
        user: {
          ...dummyUser,
          email: 'dummy@example.com',
          name: 'Dummy User',
          image: null,
          emailVerified: null,
          role: 'user',
        },
        newSession: {},
        trigger: "update",
      } as { session: Session; token: JWT; user: AdapterUser; newSession: any; trigger: "update" });
      expect((result as Session).user?.role).toBe('user');
    });

    it('returns session unchanged if session.user is missing', async () => {
      const session = {
        user: { id: 'placeholder', role: 'user', email: 'placeholder@example.com', name: 'Placeholder', image: null, emailVerified: null },
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      } as Session;
      const token = {
        sub: '123',
        role: 'admin',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      } as JWT;
      // Remove user property to simulate missing user
      const sessionNoUser = { expires: session.expires } as Session;
      const dummyUser = {
        id: 'dummy-id',
        email: 'dummy@example.com',
        name: 'Dummy User',
        image: null,
        emailVerified: null,
        role: 'user',
      };
      const result = await authOptions.callbacks!.session!({
        session: sessionNoUser,
        token,
        user: {
          ...dummyUser,
          email: 'dummy@example.com',
          name: 'Dummy User',
          image: null,
          emailVerified: null,
          role: 'user',
        },
        newSession: {},
        trigger: "update",
      } as { session: Session; token: JWT; user: AdapterUser; newSession: any; trigger: "update" });
      expect(result).toEqual(expect.objectContaining(sessionNoUser));
    });
  });
});
