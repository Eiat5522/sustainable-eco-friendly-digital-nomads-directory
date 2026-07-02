import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/lib/rate-limit');
jest.mock('@/lib/tokens');
jest.mock('@/lib/logger');
jest.mock('@/lib/email');

const mockDbConnect = jest.fn();
jest.mock('@/lib/dbConnect', () => ({
  __esModule: true,
  default: mockDbConnect,
}));

const mockFindOne = jest.fn();
jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: mockFindOne,
  },
}));

const mockUpdateOne = jest.fn();
jest.mock('@/models/PasswordResetToken', () => ({
  __esModule: true,
  default: {
    updateOne: mockUpdateOne,
  },
}));

const rateLimitMock = jest.requireMock('@/lib/rate-limit') as jest.Mocked<{
  getClientIP: (...args: any[]) => string;
  isRateLimited: (...args: any[]) => boolean;
  getRetryAfterMs: (...args: any[]) => number;
}>;

const tokenMock = jest.requireMock('@/lib/tokens') as jest.Mocked<{
  generateToken: (...args: any[]) => { raw: string; hash: string };
  minutesFromNow: (...args: any[]) => Date;
}>;

const loggerMock = jest.requireMock('@/lib/logger') as {
  structuredLogger: {
    emailError: jest.Mock;
  };
  getRequestContext: jest.Mock;
};

const emailMock = jest.requireMock('@/lib/email') as {
  buildResetEmail: jest.Mock;
  sendMail: jest.Mock;
};

type PostHandler = typeof import('../route').POST;
let POST: PostHandler;
let expiryDate: Date;
let buildResetEmailMock: jest.Mock;
let sendMailMock: jest.Mock;

const createLeanResult = <T>(value: T) => ({
  lean: jest.fn().mockResolvedValue(value),
});

const createRequest = (body: unknown) =>
  new Request('https://example.com/api/auth/request-password-reset', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/auth/request-password-reset', () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://localhost/test' };

    rateLimitMock.getClientIP.mockReturnValue('198.51.100.10');
    rateLimitMock.isRateLimited.mockReturnValue(false);
    rateLimitMock.getRetryAfterMs.mockReturnValue(90_000);

    mockDbConnect.mockResolvedValue(undefined);
    mockFindOne.mockReturnValue(createLeanResult(null));
    mockUpdateOne.mockResolvedValue({ acknowledged: true });

    tokenMock.generateToken.mockReturnValue({ raw: 'raw-token', hash: 'hashed-token' });
    expiryDate = new Date('2024-01-01T00:00:00Z');
    tokenMock.minutesFromNow.mockReturnValue(expiryDate);

    buildResetEmailMock = jest.fn().mockResolvedValue({ subject: 'hi' });
    sendMailMock = jest.fn().mockResolvedValue({ sent: true });
    emailMock.buildResetEmail = buildResetEmailMock;
    emailMock.sendMail = sendMailMock;

    loggerMock.structuredLogger.emailError.mockReset();
    loggerMock.getRequestContext.mockReturnValue({ requestId: 'req-1' });

    await jest.isolateModulesAsync(async () => {
      POST = (await import('../route')).POST;
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.useRealTimers();
  });

  it('returns limited response when IP rate limit triggers', async () => {
    rateLimitMock.isRateLimited.mockReturnValueOnce(true);

    const response = await POST(createRequest({ email: 'user@example.com' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, limited: true });
    expect(response.headers.get('retry-after')).toBe('90');
    expect(rateLimitMock.getRetryAfterMs).toHaveBeenCalledWith('auth:reset-request:198.51.100.10');
    expect(mockDbConnect).not.toHaveBeenCalled();
  });

  it('softly succeeds when MongoDB is not configured', async () => {
    delete process.env.MONGODB_URI;

    const response = await POST(createRequest({ email: 'user@example.com' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mockDbConnect).not.toHaveBeenCalled();
  });

  it('returns soft success when request validation fails', async () => {
    const response = await POST(createRequest({ email: 'not-an-email' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mockUpdateOne).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('returns soft success when no user exists for email', async () => {
    jest.useFakeTimers();
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    try {
      const responsePromise = POST(createRequest({ email: 'missing@example.com' }));
      await jest.advanceTimersByTimeAsync(180);
      const response = await responsePromise;

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
      expect(mockUpdateOne).not.toHaveBeenCalled();
      expect(sendMailMock).not.toHaveBeenCalled();
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('returns soft success when per-user rate limit triggers', async () => {
    jest.useFakeTimers();
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.4);

    const user = { _id: '507f1f77bcf86cd799439011', email: 'user@example.com' };
    mockFindOne.mockReturnValueOnce(createLeanResult(user));
    rateLimitMock.isRateLimited.mockReturnValueOnce(false).mockReturnValueOnce(true);

    try {
      const responsePromise = POST(createRequest({ email: user.email }));
      await jest.advanceTimersByTimeAsync(168);
      const response = await responsePromise;

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
      expect(mockUpdateOne).not.toHaveBeenCalled();
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('upserts a reset token and sends email for valid requests', async () => {
    const user = { _id: '507f1f77bcf86cd799439011', email: 'user@example.com' };
    mockFindOne.mockReturnValueOnce(createLeanResult(user));

    const response = await POST(createRequest({ email: user.email }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { userId: user._id },
      { $set: { tokenHash: 'hashed-token', expiresAt: expiryDate } },
      { upsert: true }
    );
    expect(buildResetEmailMock).toHaveBeenCalledWith(user.email, 'raw-token');
    expect(sendMailMock).toHaveBeenCalledWith({ subject: 'hi' });
  });

  it('logs when email delivery fails but still succeeds', async () => {
    const user = { _id: 'user-id', email: 'user@example.com' };
    mockFindOne.mockReturnValueOnce(createLeanResult(user));
    sendMailMock.mockRejectedValueOnce(new Error('smtp down'));

    const response = await POST(createRequest({ email: user.email }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(loggerMock.structuredLogger.emailError).toHaveBeenCalledWith(
      'send password reset email',
      expect.any(Error),
      expect.objectContaining({ userId: 'user-id', email: user.email })
    );
  });
});
