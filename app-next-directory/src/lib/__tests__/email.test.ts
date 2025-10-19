const resendSendMock = jest.fn();
const ResendConstructor = jest.fn().mockImplementation(() => ({
  emails: { send: resendSendMock },
}));

const getBaseUrlMock = jest.fn();

const emailErrorMock = jest.fn();

describe('email utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, RESEND_FROM: 'Support <support@example.com>' };
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_FROM;
    getBaseUrlMock.mockResolvedValue('https://app.example.com');
    resendSendMock.mockResolvedValue(undefined);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const importEmailModule = async () => {
    jest.resetModules();
    let emailModule: typeof import('../email') | undefined;
    await jest.isolateModulesAsync(async () => {
      jest.unmock('@/lib/email');
      jest.doMock('resend', () => ({
        Resend: ResendConstructor,
      }));
      jest.doMock('@/lib/absolute-url', () => ({
        getBaseUrl: () => getBaseUrlMock(),
      }));
      jest.doMock('@/lib/logger', () => ({
        structuredLogger: { emailError: (...args: unknown[]) => emailErrorMock(...args) },
      }));
      emailModule = await import('../email');
    });
    if (!emailModule) {
      throw new Error('Failed to import email module for testing');
    }
    return emailModule;
  };

  it('skips sending when API key is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { sendMail } = await importEmailModule();

    const result = await sendMail({ to: 'user@example.com', subject: 'Hello', html: '<p>Hi</p>' });

    expect(result).toEqual({ skipped: true });
    expect(ResendConstructor).not.toHaveBeenCalled();
    expect(resendSendMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('[email] RESEND_API_KEY not set; skipping send');
    warnSpy.mockRestore();
  });

  it('sends email using Resend when API key is configured', async () => {
    process.env.RESEND_API_KEY = 'test-api-key';
    const { sendMail } = await importEmailModule();

    const result = await sendMail({ to: 'user@example.com', subject: 'Welcome', html: '<p>Hello</p>', text: 'Hello' });

    expect(ResendConstructor).toHaveBeenCalledWith('test-api-key');
    expect(resendSendMock).toHaveBeenCalledWith({
      from: 'Support <support@example.com>',
      to: 'user@example.com',
      subject: 'Welcome',
      html: '<p>Hello</p>',
      text: 'Hello',
    });
    expect(result).toEqual({ sent: true });
  });

  it('returns error payload when sending fails', async () => {
    process.env.RESEND_API_KEY = 'test-api-key';
    resendSendMock.mockRejectedValueOnce(new Error('network error'));
    const { sendMail } = await importEmailModule();

    const result = await sendMail({ to: 'user@example.com', subject: 'Alert', html: '<p>Alert</p>' });

    expect(emailErrorMock).toHaveBeenCalledWith('send email', expect.any(Error), {
      to: 'user@example.com',
      subject: 'Alert',
      component: 'email-service',
    });
    expect(result).toEqual({ error: 'network error' });
  });

  it('builds verification email payloads with encoded links', async () => {
    const { buildVerifyEmail } = await importEmailModule();
    const payload = await buildVerifyEmail('user@example.com', 'token-123');

    expect(getBaseUrlMock).toHaveBeenCalled();
    expect(payload.link).toBe('https://app.example.com/api/auth/verify?token=token-123');
    expect(payload.html).toContain('Verify your email');
    expect(payload.text).toContain('token-123');
  });

  it('builds password reset email payloads', async () => {
    const { buildResetEmail } = await importEmailModule();
    const payload = await buildResetEmail('user@example.com', 'reset-456');

    expect(payload.link).toBe('https://app.example.com/auth/reset?token=reset-456');
    expect(payload.subject).toBe('Reset your password');
    expect(payload.html).toContain('Reset password');
  });

  it('builds newsletter confirmation emails without text body', async () => {
    const { buildNewsletterConfirmEmail } = await importEmailModule();
    const payload = await buildNewsletterConfirmEmail('user@example.com', 'news-token');

    expect(payload).toMatchObject({
      to: 'user@example.com',
      subject: 'Confirm your newsletter subscription',
      link: 'https://app.example.com/api/newsletter/confirm?token=news-token',
    });
    expect(payload.html).toContain('Confirm your subscription');
  });
});
