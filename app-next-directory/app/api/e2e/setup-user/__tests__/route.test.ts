import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/dbConnect', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
  structuredLogger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: jest.fn(),
  },
  BCRYPT_COST: 10,
  ROLE_VALUES: ['user', 'venueOwner', 'admin', 'superAdmin'],
}));

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
  },
  hash: jest.fn(),
}));

const mockConnect = jest.requireMock('@/lib/dbConnect').default as jest.Mock;
const mockLogger = jest.requireMock('@/lib/logger').default as {
  warn: jest.Mock;
  error: jest.Mock;
  info: jest.Mock;
};
const mockStructuredLogger = jest.requireMock('@/lib/logger').structuredLogger as {
  warn: jest.Mock;
  error: jest.Mock;
  info: jest.Mock;
};
const mockUser = jest.requireMock('@/models/User').default as {
  findOneAndUpdate: jest.Mock;
};
const mockBcrypt = jest.requireMock('bcryptjs') as {
  hash: jest.Mock;
};

const createRequest = (body: unknown) =>
  new Request('https://example.com/api/e2e/setup-user', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as NextRequest;

describe('/api/e2e/setup-user', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST', () => {
    it('should return 404 when not in E2E environment', async () => {
      delete process.env.E2E;
      delete process.env.NEXT_PUBLIC_E2E;

      jest.resetModules();
      jest.resetModules();
      const { POST } = await import('../route');
      const request = createRequest({ email: 'test@example.com', password: 'password123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Not found');
    });

    it('should return 503 when MONGODB_URI is not set', async () => {
      process.env.E2E = '1';
      delete process.env.MONGODB_URI;

      jest.resetModules();
      jest.resetModules();
      const { POST } = await import('../route');
      const request = createRequest({ email: 'test@example.com', password: 'password123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('MISSING_DB_CONFIG');
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(mockStructuredLogger.warn).toHaveBeenCalled();
    });

    it('should handle invalid JSON body', async () => {
      process.env.E2E = '1';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      jest.resetModules();
      jest.resetModules();
      const { POST } = await import('../route');
      const request = new Request('https://example.com/api/e2e/setup-user', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json',
      }) as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_INPUT');
    });

    it('should reject non-object payload', async () => {
      process.env.E2E = '1';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      jest.resetModules();
      jest.resetModules();
      const { POST } = await import('../route');
      const request = new Request('https://example.com/api/e2e/setup-user', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify('string'),
      }) as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_INPUT');
    });

    it('should reject missing email', async () => {
      process.env.E2E = '1';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      jest.resetModules();
      const { POST } = await import('../route');
      const request = createRequest({ password: 'password123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_INPUT');
    });

    it('should reject missing password', async () => {
      process.env.E2E = '1';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      jest.resetModules();
      const { POST } = await import('../route');
      const request = createRequest({ email: 'test@example.com' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_INPUT');
    });

    it('should reject empty email', async () => {
      process.env.E2E = '1';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      jest.resetModules();
      const { POST } = await import('../route');
      const request = createRequest({ email: '', password: 'password123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_INPUT');
    });

    it('should reject empty password', async () => {
      process.env.E2E = '1';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      jest.resetModules();
      const { POST } = await import('../route');
      const request = createRequest({ email: 'test@example.com', password: '' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_INPUT');
    });

    it('should create user with default role and name', async () => {
      process.env.E2E = '1';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      mockConnect.mockResolvedValue(undefined);
      mockBcrypt.hash.mockResolvedValue('hashed_password');
      mockUser.findOneAndUpdate.mockResolvedValue({
        _id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        name: 'E2E user User',
      });

      jest.resetModules();
      const { POST } = await import('../route');
      const request = createRequest({ email: 'test@example.com', password: 'password123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe('test@example.com');
      expect(data.data.user.role).toBe('user');
      expect(mockConnect).toHaveBeenCalled();
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should normalize email to lowercase', async () => {
      process.env.E2E = '1';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      mockConnect.mockResolvedValue(undefined);
      mockBcrypt.hash.mockResolvedValue('hashed_password');
      mockUser.findOneAndUpdate.mockResolvedValue({
        _id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      });

      jest.resetModules();
      const { POST } = await import('../route');
      const request = createRequest({ email: '  TEST@EXAMPLE.COM  ', password: 'password123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockUser.findOneAndUpdate).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should create user with specified role', async () => {
      process.env.E2E = '1';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      mockConnect.mockResolvedValue(undefined);
      mockBcrypt.hash.mockResolvedValue('hashed_password');
      mockUser.findOneAndUpdate.mockResolvedValue({
        _id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      });

      jest.resetModules();
      const { POST } = await import('../route');
      const request = createRequest({ email: 'admin@example.com', password: 'password123', role: 'admin' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.user.role).toBe('admin');
    });

    it('should create user with custom name', async () => {
      process.env.E2E = '1';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      mockConnect.mockResolvedValue(undefined);
      mockBcrypt.hash.mockResolvedValue('hashed_password');
      mockUser.findOneAndUpdate.mockResolvedValue({
        _id: 'user-123',
        email: 'test@example.com',
        role: 'user',
        name: 'Custom Name',
      });

      jest.resetModules();
      const { POST } = await import('../route');
      const request = createRequest({ email: 'test@example.com', password: 'password123', name: 'Custom Name' });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockUser.findOneAndUpdate).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        expect.objectContaining({
          $set: expect.objectContaining({
            name: 'Custom Name',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should use default name when name is empty string', async () => {
      process.env.E2E = '1';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      mockConnect.mockResolvedValue(undefined);
      mockBcrypt.hash.mockResolvedValue('hashed_password');
      mockUser.findOneAndUpdate.mockResolvedValue({
        _id: 'user-123',
        email: 'test@example.com',
        role: 'venueOwner',
      });

      jest.resetModules();
      const { POST } = await import('../route');
      const request = createRequest({ email: 'test@example.com', password: 'password123', name: '', role: 'venueOwner' });
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockUser.findOneAndUpdate).toHaveBeenCalledWith(
        { email: 'test@example.com' },
        expect.objectContaining({
          $set: expect.objectContaining({
            name: 'E2E venueOwner User',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should handle invalid role by using default', async () => {
      process.env.E2E = '1';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      mockConnect.mockResolvedValue(undefined);
      mockBcrypt.hash.mockResolvedValue('hashed_password');
      mockUser.findOneAndUpdate.mockResolvedValue({
        _id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      });

      jest.resetModules();
      const { POST } = await import('../route');
      const request = createRequest({ email: 'test@example.com', password: 'password123', role: 'invalidRole' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.user.role).toBe('user');
    });

    it('should handle database errors', async () => {
      process.env.E2E = '1';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      mockConnect.mockResolvedValue(undefined);
      mockBcrypt.hash.mockResolvedValue('hashed_password');
      mockUser.findOneAndUpdate.mockRejectedValue(new Error('Database connection failed'));

      jest.resetModules();
      const { POST } = await import('../route');
      const request = createRequest({ email: 'test@example.com', password: 'password123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('SERVER_ERROR');
      expect(mockStructuredLogger.error).toHaveBeenCalled();
    });

    it('should handle bcrypt errors', async () => {
      process.env.E2E = '1';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      mockConnect.mockResolvedValue(undefined);
      mockBcrypt.hash.mockRejectedValue(new Error('Bcrypt failed'));

      jest.resetModules();
      const { POST } = await import('../route');
      const request = createRequest({ email: 'test@example.com', password: 'password123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('SERVER_ERROR');
    });

    it('should work with NEXT_PUBLIC_E2E flag', async () => {
      process.env.E2E = undefined;
      process.env.NEXT_PUBLIC_E2E = '1';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

      mockConnect.mockResolvedValue(undefined);
      mockBcrypt.hash.mockResolvedValue('hashed_password');
      mockUser.findOneAndUpdate.mockResolvedValue({
        _id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      });

      jest.resetModules();
      const { POST } = await import('../route');
      const request = createRequest({ email: 'test@example.com', password: 'password123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
