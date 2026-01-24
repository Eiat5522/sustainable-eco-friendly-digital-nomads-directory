import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextRequest } from 'next/server';

// Mock dependencies BEFORE importing anything else
jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock('@/lib/auth/dal', () => ({
  __esModule: true,
  createUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  structuredLogger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

// Now import the route
import { POST } from '../route';

const mockAuth = jest.requireMock('@/lib/auth') as jest.Mocked<{
  auth: jest.Mock;
}>;

const mockDal = jest.requireMock('@/lib/auth/dal') as jest.Mocked<{
  createUser: jest.Mock;
}>;

const loggerMock = jest.requireMock('@/lib/logger') as {
  structuredLogger: {
    info: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
    warn: jest.Mock;
  };
};

const createRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new Request('https://example.com/api/admin/create-user', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  }) as NextRequest;

describe('POST /api/admin/create-user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication & Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      mockAuth.auth.mockResolvedValue(null);

      const req = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
    });

    it('should reject non-admin users', async () => {
      mockAuth.auth.mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
      });

      const req = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
    });

    it('should reject venue owner users', async () => {
      mockAuth.auth.mockResolvedValue({
        user: { id: 'user-1', role: 'venueOwner' },
      });

      const req = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Admin access required');
    });

    it('should allow admin users', async () => {
      mockAuth.auth.mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      });
      mockDal.createUser.mockResolvedValue({
        id: 'new-user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
      });

      const req = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(req);

      expect(response.status).toBe(201);
      expect(mockDal.createUser).toHaveBeenCalled();
    });

    it('should allow super admin users', async () => {
      mockAuth.auth.mockResolvedValue({
        user: { id: 'superadmin-1', role: 'superAdmin' },
      });
      mockDal.createUser.mockResolvedValue({
        id: 'new-user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
      });

      const req = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(req);

      expect(response.status).toBe(201);
      expect(mockDal.createUser).toHaveBeenCalled();
    });
  });

  describe('Request Validation', () => {
    beforeEach(() => {
      mockAuth.auth.mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      });
    });

    it('should reject invalid JSON body', async () => {
      const req = new Request('https://example.com/api/admin/create-user', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json',
      }) as NextRequest;

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body');
    });

    it('should reject request without name', async () => {
      const req = createRequest({
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name, email, and password are required');
    });

    it('should reject request without email', async () => {
      const req = createRequest({
        name: 'Test User',
        password: 'password123',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name, email, and password are required');
    });

    it('should reject request without password', async () => {
      const req = createRequest({
        name: 'Test User',
        email: 'test@example.com',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name, email, and password are required');
    });

    it('should reject request with empty name', async () => {
      const req = createRequest({
        name: '',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name, email, and password are required');
    });

    it('should reject request with empty email', async () => {
      const req = createRequest({
        name: 'Test User',
        email: '',
        password: 'password123',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name, email, and password are required');
    });

    it('should reject request with empty password', async () => {
      const req = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: '',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Name, email, and password are required');
    });
  });

  describe('User Creation', () => {
    beforeEach(() => {
      mockAuth.auth.mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      });
    });

    it('should create a user with default role and status', async () => {
      mockDal.createUser.mockResolvedValue({
        id: 'new-user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
      });

      const req = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('User created successfully');
      expect(data.user).toEqual({
        id: 'new-user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
      });
      expect(mockDal.createUser).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: undefined,
        status: undefined,
      });
    });

    it('should create a user with specified role', async () => {
      mockDal.createUser.mockResolvedValue({
        id: 'new-user-1',
        name: 'Test Admin',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active',
      });

      const req = createRequest({
        name: 'Test Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.role).toBe('admin');
      expect(mockDal.createUser).toHaveBeenCalledWith({
        name: 'Test Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
        status: undefined,
      });
    });

    it('should create a user with specified status', async () => {
      mockDal.createUser.mockResolvedValue({
        id: 'new-user-1',
        name: 'Pending User',
        email: 'pending@example.com',
        role: 'user',
        status: 'pending',
      });

      const req = createRequest({
        name: 'Pending User',
        email: 'pending@example.com',
        password: 'password123',
        status: 'pending',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.status).toBe('pending');
      expect(mockDal.createUser).toHaveBeenCalledWith({
        name: 'Pending User',
        email: 'pending@example.com',
        password: 'password123',
        role: undefined,
        status: 'pending',
      });
    });

    it('should create a venue owner user', async () => {
      mockDal.createUser.mockResolvedValue({
        id: 'new-user-1',
        name: 'Venue Owner',
        email: 'venue@example.com',
        role: 'venueOwner',
        status: 'active',
      });

      const req = createRequest({
        name: 'Venue Owner',
        email: 'venue@example.com',
        password: 'password123',
        role: 'venueOwner',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.role).toBe('venueOwner');
    });

    it('should handle duplicate email (409 conflict)', async () => {
      mockDal.createUser.mockResolvedValue(null);

      const req = createRequest({
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Failed to create user. Email might already be in use.');
    });

    it('should log user creation', async () => {
      mockDal.createUser.mockResolvedValue({
        id: 'new-user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
      });

      const req = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      await POST(req);

      expect(loggerMock.structuredLogger.info).toHaveBeenCalledWith('Admin created new user', {
        adminId: 'admin-1',
        newUserId: 'new-user-1',
        newUserEmail: 'test@example.com',
        component: 'admin-api',
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.auth.mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      });
    });

    it('should handle unexpected errors gracefully', async () => {
      mockDal.createUser.mockRejectedValue(new Error('Database connection failed'));

      const req = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(loggerMock.structuredLogger.error).toHaveBeenCalledWith(
        'Admin create user error',
        expect.any(Error),
        {
          route: '/api/admin/create-user',
          method: 'POST',
        }
      );
    });

    it('should handle auth errors', async () => {
      mockAuth.auth.mockRejectedValue(new Error('Auth failed'));

      const req = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockAuth.auth.mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      });
    });

    it('should handle whitespace in email', async () => {
      mockDal.createUser.mockResolvedValue({
        id: 'new-user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
      });

      const req = createRequest({
        name: 'Test User',
        email: '  test@example.com  ',
        password: 'password123',
      });

      const response = await POST(req);

      expect(response.status).toBe(201);
      expect(mockDal.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: '  test@example.com  ',
        })
      );
    });

    it('should handle special characters in name', async () => {
      mockDal.createUser.mockResolvedValue({
        id: 'new-user-1',
        name: "O'Connor-Smith (Jr.)",
        email: 'test@example.com',
        role: 'user',
        status: 'active',
      });

      const req = createRequest({
        name: "O'Connor-Smith (Jr.)",
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(req);

      expect(response.status).toBe(201);
      expect(mockDal.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "O'Connor-Smith (Jr.)",
        })
      );
    });

    it('should handle user session without id', async () => {
      mockAuth.auth.mockResolvedValue({
        user: { role: 'admin' },
      });
      mockDal.createUser.mockResolvedValue({
        id: 'new-user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
      });

      const req = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(req);

      expect(response.status).toBe(201);
      expect(loggerMock.structuredLogger.info).toHaveBeenCalledWith(
        'Admin created new user',
        expect.objectContaining({
          adminId: undefined,
        })
      );
    });

    it('should not expose password in response', async () => {
      mockDal.createUser.mockResolvedValue({
        id: 'new-user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
      });

      const req = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'secretPassword123!',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).not.toHaveProperty('password');
    });

    it('should handle createUser returning partial user data', async () => {
      mockDal.createUser.mockResolvedValue({
        id: 'new-user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
        // No sanityId or other optional fields
      });

      const req = createRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).toEqual({
        id: 'new-user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        status: 'active',
      });
    });
  });
});
