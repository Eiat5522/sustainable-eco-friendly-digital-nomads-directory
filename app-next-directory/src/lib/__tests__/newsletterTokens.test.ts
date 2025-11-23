import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

type SignChain = {
  setProtectedHeader: jest.MockedFunction<(header: { alg: string }) => SignChain>;
  setIssuedAt: jest.MockedFunction<() => SignChain>;
  setExpirationTime: jest.MockedFunction<(time: string) => SignChain>;
  sign: jest.MockedFunction<(key: Uint8Array) => Promise<string>>;
};

const createSignChain = (): SignChain => {
  const chain: Partial<SignChain> = {};

  chain.setProtectedHeader = jest.fn(() => chain as SignChain);
  chain.setIssuedAt = jest.fn(() => chain as SignChain);
  chain.setExpirationTime = jest.fn(() => chain as SignChain);
  chain.sign = jest.fn(async () => 'signed-token');

  return chain as SignChain;
};

let latestSignChain: SignChain | undefined;

const mockSignJWT = jest.fn(() => {
  latestSignChain = createSignChain();
  return latestSignChain;
});

const mockJwtVerify = jest.fn();

jest.mock('jose', () => ({
  __esModule: true,
  SignJWT: mockSignJWT,
  jwtVerify: mockJwtVerify,
}));

const ORIGINAL_ENV = { ...process.env };

const resetJoseMocks = () => {
  latestSignChain = undefined;
  mockSignJWT.mockClear();
  mockJwtVerify.mockReset();
};

describe('newsletterTokens', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    resetJoseMocks();
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe('signNewsletterConfirmToken - error cases', () => {
    it('throws when secret is missing', async () => {
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.JWT_SECRET;

      const { signNewsletterConfirmToken } = await import('../newsletterTokens');

      await expect(signNewsletterConfirmToken('test@example.com')).rejects.toThrow(
        'Missing newsletter token secret'
      );
    });

    it('throws when secret is too short', async () => {
      process.env.NEXTAUTH_SECRET = 'tooshort';

      const { signNewsletterConfirmToken } = await import('../newsletterTokens');

      await expect(signNewsletterConfirmToken('test@example.com')).rejects.toThrow(
        'Newsletter token secret must be at least 32 characters'
      );
    });

    it('throws when secret is exactly 31 characters', async () => {
      process.env.NEXTAUTH_SECRET = 'a'.repeat(31);

      const { signNewsletterConfirmToken } = await import('../newsletterTokens');

      await expect(signNewsletterConfirmToken('test@example.com')).rejects.toThrow(
        'Newsletter token secret must be at least 32 characters'
      );
    });

    it('throws when secret is empty string', async () => {
      process.env.NEXTAUTH_SECRET = '';

      const { signNewsletterConfirmToken } = await import('../newsletterTokens');

      await expect(signNewsletterConfirmToken('test@example.com')).rejects.toThrow(
        'Missing newsletter token secret'
      );
    });
  });

  describe('verifyNewsletterConfirmToken - error cases', () => {
    it('throws when secret is missing', async () => {
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.JWT_SECRET;

      const { verifyNewsletterConfirmToken } = await import('../newsletterTokens');

      await expect(verifyNewsletterConfirmToken('some.token.here')).rejects.toThrow(
        'Missing newsletter token secret'
      );
    });

    it('throws when secret is too short during verification', async () => {
      process.env.NEXTAUTH_SECRET = 'short';

      const { verifyNewsletterConfirmToken } = await import('../newsletterTokens');

      await expect(verifyNewsletterConfirmToken('some.token.here')).rejects.toThrow(
        'Newsletter token secret must be at least 32 characters'
      );
    });

    it('throws when secret is empty during verification', async () => {
      process.env.NEXTAUTH_SECRET = '';

      const { verifyNewsletterConfirmToken } = await import('../newsletterTokens');

      await expect(verifyNewsletterConfirmToken('some.token.here')).rejects.toThrow(
        'Missing newsletter token secret'
      );
    });

    it('throws when payload is missing email', async () => {
      process.env.NEXTAUTH_SECRET = 'a'.repeat(64);
      mockJwtVerify.mockResolvedValue({ payload: {} });

      const { verifyNewsletterConfirmToken } = await import('../newsletterTokens');

      await expect(verifyNewsletterConfirmToken('token')).rejects.toThrow(
        'Invalid token payload: missing email'
      );
      expect(mockJwtVerify).toHaveBeenCalledTimes(1);
    });
  });

  describe('module loading', () => {
    it('does not throw on module load when secret is missing', async () => {
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.JWT_SECRET;

      await expect(import('../newsletterTokens')).resolves.toBeDefined();
    });

    it('does not throw on module load when secret is too short', async () => {
      process.env.NEXTAUTH_SECRET = 'short';

      await expect(import('../newsletterTokens')).resolves.toBeDefined();
    });
  });

  describe('successful operations', () => {
    const validSecret = 's'.repeat(64);

    beforeEach(() => {
      process.env.NEXTAUTH_SECRET = validSecret;
    });

    it('signs tokens using jose SignJWT with expected claims', async () => {
      const { signNewsletterConfirmToken } = await import('../newsletterTokens');

      const token = await signNewsletterConfirmToken('user@example.com');

      expect(token).toBe('signed-token');
      expect(mockSignJWT).toHaveBeenCalledWith({ email: 'user@example.com' });

      const chain = latestSignChain!;
      expect(chain.setProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' });
      expect(chain.setIssuedAt).toHaveBeenCalledTimes(1);
      expect(chain.setExpirationTime).toHaveBeenCalledWith('24h');
      expect(chain.sign).toHaveBeenCalledTimes(1);
      const [signingKey] = chain.sign.mock.calls[0];
      expect(ArrayBuffer.isView(signingKey)).toBe(true);
      expect(signingKey).toHaveLength(validSecret.length);
    });

    it('verifies tokens and normalizes trimmed email payload', async () => {
      mockJwtVerify.mockResolvedValue({ payload: { email: '  user@example.com  ' } });

      const { verifyNewsletterConfirmToken } = await import('../newsletterTokens');

      const result = await verifyNewsletterConfirmToken('signed-token');

      expect(mockJwtVerify).toHaveBeenCalledTimes(1);
      const [token, verificationKey, options] = mockJwtVerify.mock.calls[0];
      expect(token).toBe('signed-token');
      expect(ArrayBuffer.isView(verificationKey)).toBe(true);
      expect(verificationKey).toHaveLength(validSecret.length);
      expect(options).toEqual({ algorithms: ['HS256'] });
      expect(result).toEqual({ email: 'user@example.com' });
    });
  });
});
