import type { NextAuthConfig } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { structuredLogger } from '@/lib/logger';

jest.mock('server-only', () => ({}));

const mockNextAuthInstance = {
  handlers: { GET: jest.fn(), POST: jest.fn() },
  auth: jest.fn(),
};

const nextAuthSpy = jest.fn(() => mockNextAuthInstance);

jest.mock('next-auth', () => ({
  __esModule: true,
  default: nextAuthSpy,
}));

const credentialsSpy = jest.fn((options: any) => ({
  id: 'credentials',
  type: 'credentials',
  authorize: options.authorize,
}));

const googleSpy = jest.fn((options: any) => ({
  id: 'google',
  type: 'oauth',
  options,
}));

jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: credentialsSpy,
}));

jest.mock('next-auth/providers/google', () => ({
  __esModule: true,
  default: googleSpy,
}));

const mockAdapter = { type: 'adapter' } as const;
const createAuthAdapter = jest.fn(() => mockAdapter);
const authenticateUser = jest.fn();
const getUserById = jest.fn();
const enforceLoginRateLimit = jest.fn();
const recordLoginAttempt = jest.fn();
const dbConnect = jest.fn();
const updateOne = jest.fn();
const isAdminEmail = jest.fn(() => false);

jest.mock('@/lib/auth/adapter', () => ({
  createAuthAdapter: jest.fn((...args: unknown[]) => createAuthAdapter(...args)),
}));

jest.mock('@/lib/auth/serverAuth', () => ({
  authenticateUser: jest.fn((...args: unknown[]) => authenticateUser(...args)),
  getUserById: jest.fn((...args: unknown[]) => getUserById(...args)),
}));

jest.mock('@/lib/auth/rateLimit', () => ({
  enforceLoginRateLimit: jest.fn((...args: unknown[]) => enforceLoginRateLimit(...args)),
  recordLoginAttempt: jest.fn((...args: unknown[]) => recordLoginAttempt(...args)),
}));

jest.mock('@/lib/dbConnect', () => jest.fn((...args: unknown[]) => dbConnect(...args)));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: { updateOne: jest.fn((...args: unknown[]) => updateOne(...args)) },
}));

jest.mock('@/lib/auth/config', () => ({
  isAdminEmail,
}));

const importAuthModule = async () => {
  jest.resetModules();
  // Re-establish manual mocks after resetModules
  jest.doMock('server-only', () => ({}));
  jest.doMock('next-auth', () => ({
    __esModule: true,
    default: nextAuthSpy,
  }));
  jest.doMock('next-auth/providers/credentials', () => ({
    __esModule: true,
    default: credentialsSpy,
  }));
  jest.doMock('next-auth/providers/google', () => ({
    __esModule: true,
    default: googleSpy,
  }));
  jest.doMock('@/lib/auth/adapter', () => ({
    createAuthAdapter: jest.fn((...args: unknown[]) => createAuthAdapter(...args)),
  }));
  jest.doMock('@/lib/auth/serverAuth', () => ({
    authenticateUser: jest.fn((...args: unknown[]) => authenticateUser(...args)),
    getUserById: jest.fn((...args: unknown[]) => getUserById(...args)),
  }));
  jest.doMock('@/lib/auth/rateLimit', () => ({
    enforceLoginRateLimit: jest.fn((...args: unknown[]) => enforceLoginRateLimit(...args)),
    recordLoginAttempt: jest.fn((...args: unknown[]) => recordLoginAttempt(...args)),
  }));
  jest.doMock('@/lib/dbConnect', () => jest.fn((...args: unknown[]) => dbConnect(...args)));
  jest.doMock('@/models/User', () => ({
    __esModule: true,
    default: { updateOne: jest.fn((...args: unknown[]) => updateOne(...args)) },
  }));
  jest.doMock('@/lib/auth/config', () => ({
    isAdminEmail,
  }));

  return import('../auth');
};

const extractCredentialsProvider = (authOptions: NextAuthConfig) => {
  const provider = authOptions.providers?.find((p: any) => p.id === 'credentials');
  if (!provider) throw new Error('Credentials provider not found');
  return provider as { authorize: (credentials?: any, request?: any) => Promise<any> };
};

const nextTick = () => new Promise<void>(resolve => queueMicrotask(resolve));

describe('auth module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.MONGODB_URI = '';
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    nextAuthSpy.mockReturnValue(mockNextAuthInstance);
    isAdminEmail.mockReturnValue(false);
    credentialsSpy.mockClear();
    googleSpy.mockClear();

    // Clear structuredLogger mocks
    structuredLogger.warn.mockClear();
    structuredLogger.error.mockClear();
    structuredLogger.info.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('credentials authorize', () => {
    it('authenticates a user and records login attempts on success', async () => {
      enforceLoginRateLimit.mockResolvedValue({ success: true });
      const authenticatedUser = {
        id: '123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        image: 'img.png',
        role: 'member',
      };
      authenticateUser.mockResolvedValue(authenticatedUser);
      recordLoginAttempt.mockResolvedValue(undefined);

      const { authOptions } = await importAuthModule();
      const provider = extractCredentialsProvider(authOptions);
      const request = {
        headers: {
          get: (key: string) => (key === 'x-forwarded-for' ? '203.0.113.5, 70.0.0.1' : null),
        },
      };

      const result = await provider.authorize(
        { email: '  Jane@Example.com ', password: 'secret' },
        request
      );

      expect(enforceLoginRateLimit).toHaveBeenCalledWith('jane@example.com:203.0.113.5');
      expect(authenticateUser).toHaveBeenCalledWith('jane@example.com', 'secret');
      expect(recordLoginAttempt).toHaveBeenCalledWith({
        email: 'jane@example.com',
        ip: '203.0.113.5',
        success: true,
        reason: 'success',
      });
      expect(result).toEqual({
        id: '123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        image: 'img.png',
        role: 'member',
      });
    });

    it('throws when rate limit is exceeded and logs the attempt', async () => {
      enforceLoginRateLimit.mockResolvedValue({ success: false });
      recordLoginAttempt.mockResolvedValue(undefined);
      const { authOptions } = await importAuthModule();
      const provider = extractCredentialsProvider(authOptions);

      await expect(
        provider.authorize(
          { email: 'blocked@example.com', password: 'pw' },
          { headers: { get: () => null } }
        )
      ).rejects.toThrow('Too many login attempts');

      expect(recordLoginAttempt).toHaveBeenCalledWith({
        email: 'blocked@example.com',
        ip: null,
        success: false,
        reason: 'rate_limited',
      });
    });

    it('returns null when authentication fails without throwing', async () => {
      enforceLoginRateLimit.mockResolvedValue({ success: true });
      authenticateUser.mockResolvedValue(null);
      recordLoginAttempt.mockResolvedValue(undefined);
      const { authOptions } = await importAuthModule();
      const provider = extractCredentialsProvider(authOptions);

      const result = await provider.authorize(
        { email: 'fail@example.com', password: 'pw' },
        undefined
      );

      expect(recordLoginAttempt).toHaveBeenCalledWith({
        email: 'fail@example.com',
        ip: null,
        success: false,
        reason: 'invalid_credentials',
      });
      expect(result).toBeNull();
    });

    it('swallows unexpected errors and returns null', async () => {
      enforceLoginRateLimit.mockResolvedValue({ success: true });
      authenticateUser.mockRejectedValue(new Error('database unreachable'));
      const { authOptions } = await importAuthModule();
      const provider = extractCredentialsProvider(authOptions);

      await expect(
        provider.authorize({ email: 'err@example.com', password: 'pw' }, undefined)
      ).resolves.toBeNull();
      expect(recordLoginAttempt).not.toHaveBeenCalled();
    });
  });

  describe('callbacks.signIn', () => {
    it('verifies OAuth sign-ins when MongoDB URI is configured', async () => {
      process.env.MONGODB_URI = 'mongodb://example.test/db';
      enforceLoginRateLimit.mockResolvedValue({ success: true });
      const { authOptions } = await importAuthModule();
      const signIn = authOptions.callbacks?.signIn as Required<
        NextAuthConfig['callbacks']
      >['signIn'];
      updateOne.mockResolvedValue({ acknowledged: true });

      const result = await signIn?.({
        user: { email: 'verified@example.com' },
        account: { provider: 'google' },
        profile: { email_verified: true },
      } as any);

      expect(dbConnect).toHaveBeenCalledTimes(1);
      expect(updateOne).toHaveBeenCalledWith(
        {
          email: 'verified@example.com',
          emailVerified: null,
        },
        { $set: { emailVerified: expect.any(Date) } },
        { maxTimeMS: 5000 }
      );
      expect(result).toBe(true);
    });

    it('never blocks sign-in when verification syncing fails', async () => {
      process.env.MONGODB_URI = 'mongodb://example.test/db';
      const { authOptions } = await importAuthModule();
      const signIn = authOptions.callbacks?.signIn as Required<
        NextAuthConfig['callbacks']
      >['signIn'];
      updateOne.mockRejectedValue(new Error('write failed'));

      const result = await signIn?.({
        user: { email: 'user@example.com' },
        account: { provider: 'google' },
        profile: { email_verified: true },
      } as any);

      expect(structuredLogger.warn).toHaveBeenCalledWith(
        '[auth] signIn verification sync failed',
        expect.any(Error)
      );
      expect(result).toBe(true);
    });

    it('skips verification flow for credentials provider', async () => {
      const { authOptions } = await importAuthModule();
      const signIn = authOptions.callbacks?.signIn as Required<
        NextAuthConfig['callbacks']
      >['signIn'];

      const result = await signIn?.({
        user: { email: 'user@example.com' },
        account: { provider: 'credentials' },
      } as any);

      expect(dbConnect).not.toHaveBeenCalled();
      expect(updateOne).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('callbacks.jwt', () => {
    it('enriches token metadata and reports allowlist failures in browser-like environments', async () => {
      isAdminEmail.mockReturnValue(true);
      getUserById.mockResolvedValue({ name: 'Updated Name', role: 'member' });

      const { authOptions } = await importAuthModule();
      const configModule = await import('@/lib/auth/config');
      expect(configModule.isAdminEmail).toBe(isAdminEmail);
      configModule.isAdminEmail('probe@example.com');
      expect(isAdminEmail).toHaveBeenCalledWith('probe@example.com');
      isAdminEmail.mockClear();
      isAdminEmail.mockReturnValue(true);
      const jwtCallback = authOptions.callbacks?.jwt as Required<
        NextAuthConfig['callbacks']
      >['jwt'];

      const token = await jwtCallback?.({
        token: { email: 'admin@example.com' } as JWT,
        user: { id: 'user-1', name: 'Admin User', role: 'member' },
      } as any);

      expect(token).toMatchObject({
        id: 'user-1',
        name: 'Admin User',
        role: 'member',
      });

      await nextTick();
      expect(isAdminEmail).not.toHaveBeenCalled();
      expect(structuredLogger.error).toHaveBeenCalledWith(
        '[auth] failed to queue admin allowlist promotion flow',
        expect.any(Error)
      );
      expect(structuredLogger.info).not.toHaveBeenCalled();
    });

    it('refreshes token details when user object is absent', async () => {
      isAdminEmail.mockReturnValue(false);
      getUserById.mockResolvedValue({ name: 'Fetched User', role: 'admin' });

      const { authOptions } = await importAuthModule();
      const jwtCallback = authOptions.callbacks?.jwt as Required<
        NextAuthConfig['callbacks']
      >['jwt'];
      const token = await jwtCallback?.({
        token: { id: 'user-2', email: 'fetched@example.com' } as JWT,
        trigger: 'update',
      } as any);

      expect(getUserById).toHaveBeenCalledWith('user-2');
      expect(token).toMatchObject({ name: 'Fetched User', role: 'admin', id: 'user-2' });
    });
  });

  describe('callbacks.session', () => {
    it('syncs id and role from the user object when available', async () => {
      const { authOptions } = await importAuthModule();
      const sessionCallback = authOptions.callbacks?.session as Required<
        NextAuthConfig['callbacks']
      >['session'];
      const session = await sessionCallback?.({
        session: { user: {} },
        user: { id: 'abc', role: 'admin' },
        token: { id: 'ignored', role: 'member' },
      } as any);

      expect(session?.user).toMatchObject({ id: 'abc', role: 'admin' });
    });

    it('falls back to token derived values when user is not supplied', async () => {
      const { authOptions } = await importAuthModule();
      const sessionCallback = authOptions.callbacks?.session as Required<
        NextAuthConfig['callbacks']
      >['session'];
      const session = await sessionCallback?.({
        session: { user: {} },
        token: { id: 'token-id', role: 'member' },
      } as any);

      expect(session?.user).toMatchObject({ id: 'token-id', role: 'member' });
    });
  });

  it('initialises NextAuth with the constructed configuration', async () => {
    const { authOptions, GET, POST, auth } = await importAuthModule();
    expect(nextAuthSpy).toHaveBeenCalledWith(authOptions);
    expect(GET).toBe(mockNextAuthInstance.handlers.GET);
    expect(POST).toBe(mockNextAuthInstance.handlers.POST);
    expect(auth).toBe(mockNextAuthInstance.auth);
  });

  it('includes Google provider when credentials are configured', async () => {
    process.env.GOOGLE_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'client-secret';
    const { authOptions } = await importAuthModule();

    const providerIds = authOptions.providers?.map((p: any) => p.id) ?? [];
    expect(providerIds).toContain('google');
    expect(googleSpy).toHaveBeenCalledWith({
      clientId: 'client-id',
      clientSecret: 'client-secret',
    });
  });
});
