import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/lib/rate-limit');
jest.mock('@/lib/tokens');
jest.mock('@/lib/logger', () => ({
  __esModule: true,
  structuredLogger: {
    security: jest.fn(),
    authError: jest.fn(),
  },
  getRequestContext: jest.fn(() => ({ requestId: 'ctx-1' })),
}));

const mockDbConnect = jest.fn();
jest.mock('@/lib/dbConnect', () => ({
  __esModule: true,
  default: mockDbConnect,
}));

const mockFindOne = jest.fn();
const mockDeleteOne = jest.fn();
jest.mock('@/models/PasswordResetToken', () => ({
  __esModule: true,
  default: {
    findOne: mockFindOne,
    deleteOne: mockDeleteOne,
  },
}));

const mockFindById = jest.fn();
const mockStartSession = jest.fn();
jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findById: mockFindById,
    startSession: mockStartSession,
  },
}));

const rateLimitMock = jest.requireMock('@/lib/rate-limit') as jest.Mocked<{
  getClientIp: (...args: any[]) => string;
  isRateLimited: (...args: any[]) => boolean;
  getRetryAfterMs: (...args: any[]) => number;
}>;

const tokenMock = jest.requireMock('@/lib/tokens') as jest.Mocked<{
  hashToken: (...args: any[]) => string;
}>;

const loggerMock = jest.requireMock('@/lib/logger') as {
  structuredLogger: {
    security: jest.Mock;
    authError: jest.Mock;
  };
  getRequestContext: jest.Mock;
};

let POST: typeof import('../route').POST;

const createLeanResult = <T>(value: T) => ({
  lean: jest.fn().mockResolvedValue(value),
});

const createSelectResult = <T>(value: T) => ({
  select: jest.fn().mockResolvedValue(value),
});

const createSession = () => {
  const withTransaction = jest.fn(async (handler: () => Promise<void>) => {
    await handler();
  });
  return {
    withTransaction,
    endSession: jest.fn().mockResolvedValue(undefined),
  };
};

const createRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://example.com/api/auth/reset-password', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

describe('POST /api/auth/reset-password', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://localhost/test' };
    rateLimitMock.getClientIp.mockReturnValue('203.0.113.10');
    rateLimitMock.isRateLimited.mockReturnValue(false);
    rateLimitMock.getRetryAfterMs.mockReturnValue(120_000);
    tokenMock.hashToken.mockImplementation((token: string) => `hashed:${token}`);
    mockDbConnect.mockResolvedValue(undefined);
    mockFindOne.mockReturnValue(createLeanResult(null));
    mockDeleteOne.mockReturnValue({ session: jest.fn().mockResolvedValue({ deletedCount: 1 }) });
    mockFindById.mockReturnValue(createSelectResult(null));
    mockStartSession.mockResolvedValue(createSession());

    await jest.isolateModulesAsync(async () => {
      POST = (await import('../route')).POST;
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('enforces IP rate limiting', async () => {
    rateLimitMock.isRateLimited.mockReturnValueOnce(true);

    const response = await POST(
      createRequest(
        { token: 'sample-token', password: 'Password123!' },
        { 'x-request-id': 'req-1' }
      )
    );

    expect(response.status).toBe(429);
    expect(rateLimitMock.getRetryAfterMs).toHaveBeenCalledWith('auth:reset:203.0.113.10');
    expect(mockDbConnect).not.toHaveBeenCalled();
  });

  it('fails when MongoDB connection string is missing', async () => {
    delete process.env.MONGODB_URI;

    const response = await POST(createRequest({ token: 't', password: 'Password123!' }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Server not configured (db)' });
  });

  it('rejects non-JSON payloads', async () => {
    const response = await POST(
      createRequest(
        { token: 'token', password: 'Password123!' },
        { 'content-type': 'text/plain', traceparent: '00-abc123' }
      )
    );

    expect(mockDbConnect).toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid content type' });
  });

  it('returns 400 for invalid request bodies', async () => {
    const response = await POST(createRequest({ token: '', password: 'short' }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request data' });
    expect(loggerMock.structuredLogger.authError).toHaveBeenCalled();
  });

  it('returns 400 when reset token is missing or expired', async () => {
    mockFindOne.mockReturnValueOnce(createLeanResult(null));

    const responseMissing = await POST(
      createRequest({ token: 'token-00001', password: 'Password123!' })
    );
    expect(responseMissing.status).toBe(400);

    const expiredDoc = {
      _id: 'token-id',
      userId: 'user-42',
      expiresAt: new Date(Date.now() - 10_000),
    };
    mockFindOne.mockReturnValueOnce(createLeanResult(expiredDoc));

    const responseExpired = await POST(
      createRequest({ token: 'token-00002', password: 'Password123!' })
    );
    expect(responseExpired.status).toBe(400);
  });

  it('returns 404 when the user cannot be found', async () => {
    const validDoc = {
      _id: 'token-id',
      userId: 'user-100',
      expiresAt: new Date(Date.now() + 60_000),
    };
    mockFindOne.mockReturnValueOnce(createLeanResult(validDoc));
    mockFindById.mockReturnValueOnce(createSelectResult(null));

    const response = await POST(createRequest({ token: 'token-00003', password: 'Password123!' }));

    expect(response.status).toBe(404);
  });

  it('returns 500 when user password field is inaccessible', async () => {
    const doc = { _id: 'token-id', userId: 'user-1', expiresAt: new Date(Date.now() + 60_000) };
    mockFindOne.mockReturnValueOnce(createLeanResult(doc));
    const badUser = { password: undefined, set: jest.fn(), save: jest.fn() } as any;
    mockFindById.mockReturnValueOnce(createSelectResult(badUser));

    const response = await POST(createRequest({ token: 'token-00004', password: 'Password123!' }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Password reset failed' });
    expect(loggerMock.structuredLogger.authError).toHaveBeenCalled();
  });

  it('handles JSON parse failures gracefully', async () => {
    const brokenRequest = new Request('https://example.com/api/auth/reset-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    }) as Request & { json: () => Promise<never> };
    brokenRequest.json = () => Promise.reject(new Error('boom'));

    const response = await POST(brokenRequest);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Password reset failed' });
    expect(loggerMock.structuredLogger.authError).toHaveBeenCalled();
  });

  it('resets the password and clears token on success', async () => {
    const doc = { _id: 'token-id', userId: 'user-777', expiresAt: new Date(Date.now() + 600_000) };
    const user = {
      password: 'old-hash',
      set: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    } as any;
    const session = createSession();
    const deleteOneSession = jest.fn().mockResolvedValue({ acknowledged: true });

    mockFindOne.mockReturnValueOnce(createLeanResult(doc));
    mockFindById.mockReturnValueOnce(createSelectResult(user));
    mockStartSession.mockResolvedValueOnce(session);
    mockDeleteOne.mockReturnValueOnce({ session: deleteOneSession });

    const response = await POST(
      createRequest(
        { token: 'valid-token', password: 'Password123!' },
        { 'x-request-id': 'req-777' }
      )
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(tokenMock.hashToken).toHaveBeenCalledWith('valid-token');
    expect(user.set).toHaveBeenCalledWith('password', 'Password123!');
    expect(user.save).toHaveBeenCalledWith({ session });
    expect(deleteOneSession).toHaveBeenCalledWith(session);
    expect(session.withTransaction).toHaveBeenCalledTimes(1);
  });
});
