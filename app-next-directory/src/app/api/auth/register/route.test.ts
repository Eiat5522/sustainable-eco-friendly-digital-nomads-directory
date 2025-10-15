import { jest } from '@jest/globals';

const emailVerificationTokenCreateMock = jest.fn();
const generateTokenMock = jest.fn(() => ({ raw: 'token-raw', hash: 'token-hash' }));
const minutesFromNowMock = jest.fn(() => new Date('2024-01-01T00:00:00.000Z'));
const buildVerifyEmailMock = jest.fn(async () => ({ to: 'test@example.com' }));
const sendMailMock = jest.fn(async () => ({ messageId: 'mock-message' }));
const isEmailVerificationRequiredMock = jest.fn(() => false);
const userFindOneMock = jest.fn();
const userSelectMock = jest.fn();
const userLeanMock = jest.fn();
const userCreateMock = jest.fn();
const userUpdateOneMock = jest.fn();

jest.mock('@/models/EmailVerificationToken', () => ({
  __esModule: true,
  default: {
    create: emailVerificationTokenCreateMock,
  },
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: userFindOneMock,
    updateOne: userUpdateOneMock,
    create: userCreateMock,
  },
}));

jest.mock('@/lib/tokens', () => ({
  __esModule: true,
  generateToken: generateTokenMock,
  minutesFromNow: minutesFromNowMock,
  default: {
    generateToken: generateTokenMock,
    minutesFromNow: minutesFromNowMock,
  },
}));

jest.mock('@/lib/email', () => ({
  __esModule: true,
  buildVerifyEmail: buildVerifyEmailMock,
  sendMail: sendMailMock,
  default: {
    buildVerifyEmail: buildVerifyEmailMock,
    sendMail: sendMailMock,
  },
}));

jest.mock('@/lib/auth/config', () => ({
  __esModule: true,
  isEmailVerificationRequired: isEmailVerificationRequiredMock,
  default: { isEmailVerificationRequired: isEmailVerificationRequiredMock },
}));

jest.mock('@/lib/logger');

const createRequest = (body: unknown) =>
  new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/auth/register', () => {
  const originalProcessEnv = process.env;
  let envSnapshot: NodeJS.ProcessEnv;
  let POST: (req: Request) => Promise<Response>;
  let rateLimitModule: any;
  let structuredLoggerMock: any;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    emailVerificationTokenCreateMock.mockReset();
    generateTokenMock.mockReset();
    minutesFromNowMock.mockReset();
    buildVerifyEmailMock.mockReset();
    sendMailMock.mockReset();
    isEmailVerificationRequiredMock.mockReset();

    emailVerificationTokenCreateMock.mockResolvedValue(undefined);
    generateTokenMock.mockReturnValue({ raw: 'token-raw', hash: 'token-hash' });
    minutesFromNowMock.mockReturnValue(new Date('2024-01-01T00:00:00.000Z'));
    buildVerifyEmailMock.mockResolvedValue({ to: 'test@example.com' });
    sendMailMock.mockResolvedValue({ messageId: 'mock-message' });
    isEmailVerificationRequiredMock.mockReturnValue(false);

    envSnapshot = { ...process.env };
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test-db';

    const loggerModule: any = await import('@/lib/logger');
    structuredLoggerMock = loggerModule.structuredLogger;

    const rlModule: any = await import('@/lib/rate-limit');
    rateLimitModule = rlModule.default ?? rlModule;
    rateLimitModule.getClientIp.mockClear();
    rateLimitModule.isRateLimited.mockClear();
    rateLimitModule.getRetryAfterMs.mockClear();
    rateLimitModule.getClientIp.mockReturnValue('127.0.0.1');
    rateLimitModule.isRateLimited.mockReturnValue(false);
    rateLimitModule.getRetryAfterMs.mockReturnValue(60_000);

    userFindOneMock.mockReset();
    userSelectMock.mockReset();
    userLeanMock.mockReset();
    userCreateMock.mockReset();
    userUpdateOneMock.mockReset();
    userFindOneMock.mockReturnValue({
      select: userSelectMock,
      lean: userLeanMock,
    });
    userSelectMock.mockReturnValue({ lean: userLeanMock });
    userLeanMock.mockResolvedValue(null);
    userCreateMock.mockResolvedValue({
      toObject: () => ({ _id: 'user-id', email: 'test@example.com' }),
    });

    const routeModule = await import('./route');
    POST = routeModule.POST;
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  afterAll(() => {
    process.env = originalProcessEnv;
  });

  const execute = async (body: Record<string, unknown>) => {
    const response = await POST(createRequest(body));
    const json = await response.json();
    return { response, json } as const;
  };

  it('returns 429 when requests exceed the rate limit', async () => {
    rateLimitModule.isRateLimited.mockReturnValueOnce(true);
    rateLimitModule.getRetryAfterMs.mockReturnValueOnce(2500);

    const { response, json } = await execute({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('3');
    expect(json).toEqual({ error: 'Too many requests' });
    expect(userCreateMock).not.toHaveBeenCalled();
  });

  it('returns 500 when the database connection string is missing', async () => {
    process.env.MONGODB_URI = '';

    const { response, json } = await execute({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: 'Server not configured (db)' });
  });

  it('returns 400 for invalid payloads', async () => {
    const { response, json } = await execute({
      email: 'invalid-email',
      password: 'short',
    });

    expect(response.status).toBe(400);
    expect(json.error).toContain('at least 8');
    expect(userFindOneMock).not.toHaveBeenCalled();
  });

  it('returns 409 when the email is already registered', async () => {
    userLeanMock.mockResolvedValueOnce({
      _id: 'existing-id',
      email: 'existing@example.com',
    });

    const { response, json } = await execute({
      email: 'existing@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(409);
    expect(json).toEqual({ error: 'Email already in use' });
    expect(userCreateMock).not.toHaveBeenCalled();
  });

  it('returns 409 when user creation fails with duplicate key error', async () => {
    userCreateMock.mockRejectedValueOnce({ code: 11000 });

    const { response, json } = await execute({
      email: 'duplicate@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(409);
    expect(json).toEqual({ error: 'Email already in use' });
  });

  it('registers successfully without requiring email verification', async () => {
    const { response, json } = await execute({
      name: ' Test User ',
      email: ' Fresh@Example.COM ',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true, emailVerificationRequired: false });
    expect(userCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test User',
        email: 'fresh@example.com',
        emailVerified: expect.any(Date),
      })
    );
    expect(emailVerificationTokenCreateMock).not.toHaveBeenCalled();
    expect(buildVerifyEmailMock).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('registers and sends verification email when verification is required', async () => {
    const expiresAt = new Date('2024-02-01T00:00:00.000Z');
    minutesFromNowMock.mockReturnValueOnce(expiresAt);
    isEmailVerificationRequiredMock.mockReturnValueOnce(true);
    buildVerifyEmailMock.mockResolvedValueOnce({ to: 'verify@example.com' });

    userCreateMock.mockResolvedValueOnce({
      toObject: () => ({ _id: 'user-verify', email: 'verify@example.com' }),
    });

    const { response, json } = await execute({
      email: 'verify@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true, emailVerificationRequired: true });
    expect(emailVerificationTokenCreateMock).toHaveBeenCalledWith({
      userId: 'user-verify',
      tokenHash: 'token-hash',
      expiresAt,
    });
    expect(buildVerifyEmailMock).toHaveBeenCalledWith('verify@example.com', 'token-raw');
    expect(sendMailMock).toHaveBeenCalledWith({ to: 'verify@example.com' });
  });

  it('logs a warning when verification is required but the user id is missing', async () => {
    isEmailVerificationRequiredMock.mockReturnValueOnce(true);
    userCreateMock.mockResolvedValueOnce({
      toObject: () => ({ email: 'no-id@example.com' }),
    });

    const { response, json } = await execute({
      email: 'no-id@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true, emailVerificationRequired: true });
    expect(structuredLoggerMock.warn).toHaveBeenCalledWith(
      'registration missing user id for verification token',
      expect.objectContaining({ email: 'no-id@example.com' })
    );
    expect(emailVerificationTokenCreateMock).not.toHaveBeenCalled();
  });

  it('logs email errors when sending the verification email fails', async () => {
    const expiresAt = new Date('2024-03-01T00:00:00.000Z');
    minutesFromNowMock.mockReturnValueOnce(expiresAt);
    isEmailVerificationRequiredMock.mockReturnValueOnce(true);
    sendMailMock.mockRejectedValueOnce(new Error('mail failed'));

    userCreateMock.mockResolvedValueOnce({
      toObject: () => ({ _id: 'user-log', email: 'log@example.com' }),
    });

    const { response, json } = await execute({
      email: 'log@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(json).toEqual({ success: true, emailVerificationRequired: true });
    expect(emailVerificationTokenCreateMock).toHaveBeenCalledWith({
      userId: 'user-log',
      tokenHash: 'token-hash',
      expiresAt,
    });
    expect(structuredLoggerMock.emailError).toHaveBeenCalledWith(
      'send verification email',
      expect.any(Error),
      expect.objectContaining({
        userId: 'user-log',
        email: 'log@example.com',
      })
    );
  });
});
