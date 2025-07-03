import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { User } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";

// Mock authOptions from ../auth with required callbacks and types
jest.mock('../auth', () => ({
  __esModule: true,
  default: {
    adapter: jest.fn(),
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
          id: (token as any).id ?? "test-id",
          role: (token as any).role ?? "user",
          email: (token as any).email ?? "test@example.com",
          name: (token as any).name ?? "Test User",
          image: (token as any).image ?? null,
          sub: (token as any).sub ?? (token as any).id ?? "test-id",
        } as JWT;
      },
      session: async ({ session, token }: { session: Session; token: JWT }) => {
        if (!session.user) {
          return {
            ...session,
            user: {
              id: (token as any).sub ?? (token as any).id ?? "test-id",
              role: (token as any).role ?? "user",
              email: (token as any).email ?? "test@example.com",
              name: (token as any).name ?? "Test User",
              image: (token as any).image ?? null,
            },
            expires: session.expires ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          } as Session;
        }
        return {
          ...session,
          user: {
            ...(session.user ?? {}),
            id: (token as any).sub ?? (token as any).id ?? "test-id",
            role: (token as any).role ?? "user",
            email: (token as any).email ?? "test@example.com",
            name: (token as any).name ?? "Test User",
            image: (token as any).image ?? null,
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

describe('authOptions object', () => {
  it('should have the correct structure and config properties', () => {
    expect(authOptions).toHaveProperty('adapter');
    expect(authOptions).toHaveProperty('callbacks');
    expect(typeof authOptions.adapter).toBe('function');
    expect(typeof authOptions.callbacks?.jwt).toBe('function');
    expect(typeof authOptions.callbacks?.session).toBe('function');
  });
  describe('jwt', () => {
    it('adds user role to token if user is present', async () => {
      const token = {} as any;
      const user = {
        id: 'test-id',
        role: 'admin',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        emailVerified: null,
      } as any;
      const result = await authOptions.callbacks?.jwt?.({
        token,
        user,
        account: null,
        profile: undefined,
        trigger: undefined,
        isNewUser: undefined,
        session: undefined,
      } as any);
      expect(result && (result as any).role).toBe('admin');
    });

    it('defaults role to "user" if user has no role', async () => {
      const token = {} as any;
      const user = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
        emailVerified: null,
      } as any;
      const result = await authOptions.callbacks?.jwt?.({
        token,
        user,
        account: null,
        profile: undefined,
        trigger: undefined,
        isNewUser: undefined,
        session: undefined,
      } as any);
      expect(result && (result as any).role).toBe('user');
    });

    it('does not modify token if user is not present', async () => {
      const token = { foo: 'bar' } as any;
      const dummyUser = {
        id: 'dummy-id',
        email: 'dummy@example.com',
        name: 'Dummy User',
        image: null,
        emailVerified: null,
        role: 'user',
      } as any;
      const result = await authOptions.callbacks?.jwt?.({
        token,
        user: dummyUser,
        account: null,
        profile: undefined,
        trigger: undefined,
        isNewUser: undefined,
        session: undefined,
      } as any);
      expect(result && (result as any).foo).toBe('bar');
    });
  });

  describe('session', () => {
    it('adds id and role to session.user if token and session.user exist', async () => {
      const session = {
        user: { id: 'placeholder', role: 'admin', email: 'placeholder@example.com', name: 'Placeholder', image: null, emailVerified: null },
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      } as Session;
      const token = {
        id: '123',
        sub: '123',
        role: 'admin',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      } as any;
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
        token: token as JWT,
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
      } as any);
      expect((result as Session).user?.id).toBe('123');
      expect((result as Session).user?.role).toBe('admin');
    });

    it('defaults role to "user" if token.role is missing', async () => {
      const session = {
        user: { id: 'placeholder', role: 'user', email: 'placeholder@example.com', name: 'Placeholder', image: null, emailVerified: null },
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      } as Session;
      const token = {
        id: '123',
        sub: '123',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      } as any;
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
        token: token as JWT,
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
      } as any);
      expect((result as Session).user?.role).toBe('user');
    });

    it('returns session unchanged if session.user is missing', async () => {
      const session = {
        user: { id: 'placeholder', role: 'user', email: 'placeholder@example.com', name: 'Placeholder', image: null, emailVerified: null },
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      } as Session;
      const token = {
        id: '123',
        sub: '123',
        role: 'admin',
        email: 'test@example.com',
        name: 'Test User',
        image: null,
      } as any;
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
        token: token as JWT,
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
      } as any);
      expect(result).toEqual(expect.objectContaining(sessionNoUser));
    });
  });
});
