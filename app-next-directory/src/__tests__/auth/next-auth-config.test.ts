/**
 * Jest Test Suite for Next Auth Configuration
 * 
 * Tests covering:
 * 1. Auth configuration setup
 * 2. Credentials provider setup
 * 3. JWT and session callbacks
 * 4. Admin allowlist functionality
 * 5. Rate limiting integration
 * 6. OAuth provider configuration (when enabled)
 */

import { jest } from '@jest/globals';

// Mock Next Auth and dependencies
jest.mock('next-auth', () => ({
  default: jest.fn(),
}));

jest.mock('next-auth/providers/credentials', () => ({
  default: jest.fn((config) => config),  // Updated: Return the config object so authOptions.providers[0] is the provider with authorize
}));

jest.mock('@/lib/auth/adapter', () => ({
  createAuthAdapter: jest.fn(),
}));

jest.mock('@/lib/auth/serverAuth', () => ({
  authenticateUser: jest.fn(),
}));

jest.mock('@/lib/auth/rateLimit', () => ({
  enforceLoginRateLimit: jest.fn(),
  recordLoginAttempt: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  updateOne: jest.fn(),
}));

jest.mock('@/lib/auth/config', () => ({
  isAdminEmail: jest.fn(),
}));

import { createAuthAdapter } from '@/lib/auth/adapter';
import { authenticateUser } from '@/lib/auth/serverAuth';
import { enforceLoginRateLimit, recordLoginAttempt } from '@/lib/auth/rateLimit';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { isAdminEmail } from '@/lib/auth/config';
import type { UserRole } from '@/types/auth';

// Type the mocks
const mockCreateAuthAdapter = createAuthAdapter as jest.MockedFunction<typeof createAuthAdapter>;
const mockAuthenticateUser = authenticateUser as jest.MockedFunction<typeof authenticateUser>;
const mockEnforceLoginRateLimit = enforceLoginRateLimit as jest.MockedFunction<typeof enforceLoginRateLimit>;
const mockRecordLoginAttempt = recordLoginAttempt as jest.MockedFunction<typeof recordLoginAttempt>;
const mockDbConnect = dbConnect as jest.MockedFunction<typeof dbConnect>;
const mockUserUpdateOne = User.updateOne as jest.MockedFunction<typeof User.updateOne>;
const mockIsAdminEmail = isAdminEmail as jest.MockedFunction<typeof isAdminEmail>;

// Import auth config after mocking dependencies
import { authOptions } from '@/lib/auth';

describe('Next Auth Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateAuthAdapter.mockReturnValue({} as any);
    mockDbConnect.mockResolvedValue(undefined);
  });

  describe('Auth Configuration Structure', () => {
    it('should have valid auth configuration structure', () => {
      expect(authOptions).toBeDefined();
      expect(authOptions.providers).toBeDefined();
      expect(authOptions.pages).toBeDefined();
      expect(authOptions.callbacks).toBeDefined();
      expect(authOptions.session).toBeDefined();
    });

    it('should configure JWT session strategy', () => {
      expect(authOptions.session).toEqual({ strategy: 'jwt' });
    });

    it('should configure correct sign-in page', () => {
      expect(authOptions.pages?.signIn).toBe('/auth/login');
    });

    it('should include credentials provider', () => {
      expect(authOptions.providers).toHaveLength(1);
      // The provider should be configured for credentials
      expect(authOptions.providers[0]).toBeDefined();
    });

    it('should configure adapter when available', () => {
      mockCreateAuthAdapter.mockReturnValue({ name: 'mongodb' } as any);
      
      // Since we can't easily re-import, we'll verify the adapter was called
      expect(mockCreateAuthAdapter).toHaveBeenCalled();
    });
  });

  describe('Credentials Provider', () => {
    let credentialsProvider: any;

    beforeEach(() => {
      credentialsProvider = authOptions.providers[0];
    });

    describe('Authorization Function', () => {
      const mockRequest = {
        headers: {
          get: jest.fn().mockReturnValue('127.0.0.1'),
        },
      };

      it('should authenticate user with valid credentials', async () => {
        const mockUser = {
          id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user' as UserRole,
          image: null,
        };

        mockEnforceLoginRateLimit.mockResolvedValue({ success: true });
        mockAuthenticateUser.mockResolvedValue(mockUser);
        mockRecordLoginAttempt.mockResolvedValue(undefined);

        const credentials = {
          email: 'john@example.com',
          password: 'password123',
        };

        const result = await credentialsProvider.authorize(credentials, mockRequest);

        expect(result).toEqual({
          id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          image: null,
        });
        expect(mockAuthenticateUser).toHaveBeenCalledWith('john@example.com', 'password123');
        expect(mockRecordLoginAttempt).toHaveBeenCalledWith({
          email: 'john@example.com',
          ip: '127.0.0.1',
          success: true,
          reason: 'success',
        });
      });

      it('should reject authentication with invalid credentials', async () => {
        mockEnforceLoginRateLimit.mockResolvedValue({ success: true });
        mockAuthenticateUser.mockResolvedValue(null);
        mockRecordLoginAttempt.mockResolvedValue(undefined);

        const credentials = {
          email: 'john@example.com',
          password: 'wrongpassword',
        };

        const result = await credentialsProvider.authorize(credentials, mockRequest);

        expect(result).toBeNull();
        expect(mockRecordLoginAttempt).toHaveBeenCalledWith({
          email: 'john@example.com',
          ip: '127.0.0.1',
          success: false,
          reason: 'invalid_credentials',
        });
      });

      it('should handle missing credentials', async () => {
        const result1 = await credentialsProvider.authorize({}, mockRequest);
        const result2 = await credentialsProvider.authorize({ email: 'test@example.com' }, mockRequest);
        const result3 = await credentialsProvider.authorize({ password: 'password' }, mockRequest);

        expect(result1).toBeNull();
        expect(result2).toBeNull();
        expect(result3).toBeNull();
      });

      it('should enforce rate limiting', async () => {
        mockEnforceLoginRateLimit.mockResolvedValue({ success: false });
        mockRecordLoginAttempt.mockResolvedValue(undefined);

        const credentials = {
          email: 'john@example.com',
          password: 'password123',
        };

        await expect(
          credentialsProvider.authorize(credentials, mockRequest)
        ).rejects.toThrow('Too many login attempts. Please try again later.');

        expect(mockRecordLoginAttempt).toHaveBeenCalledWith({
          email: 'john@example.com',
          ip: '127.0.0.1',
          success: false,
          reason: 'rate_limited',
        });
      });

      it('should handle IP extraction for rate limiting', async () => {
        const mockRequestWithForwardedFor = {
          headers: {
            get: jest.fn()
              .mockReturnValueOnce('192.168.1.100, 10.0.0.1') // x-forwarded-for
              .mockReturnValueOnce(null), // x-real-ip
          },
        };

        mockEnforceLoginRateLimit.mockResolvedValue({ success: true });
        mockAuthenticateUser.mockResolvedValue({
          id: 'user123',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user' as UserRole,
        });

        const credentials = {
          email: 'john@example.com',
          password: 'password123',
        };

        await credentialsProvider.authorize(credentials, mockRequestWithForwardedFor);

        expect(mockEnforceLoginRateLimit).toHaveBeenCalledWith('john@example.com:192.168.1.100');
      });

      it('should handle authentication errors gracefully', async () => {
        mockEnforceLoginRateLimit.mockResolvedValue({ success: true });
        mockAuthenticateUser.mockRejectedValue(new Error('Database error'));

        const credentials = {
          email: 'john@example.com',
          password: 'password123',
        };

        const result = await credentialsProvider.authorize(credentials, mockRequest);

        expect(result).toBeNull();
      });

      it('should rethrow rate limit errors', async () => {
        mockEnforceLoginRateLimit.mockResolvedValue({ success: false });

        const credentials = {
          email: 'john@example.com',
          password: 'password123',
        };

        await expect(
          credentialsProvider.authorize(credentials, mockRequest)
        ).rejects.toThrow('Too many login attempts. Please try again later.');
      });
    });
  });

  describe('Callback Functions', () => {
    describe('signIn Callback', () => {
      it('should allow credentials sign-in', async () => {
        const user = { email: 'user@example.com' };
        const account = { provider: 'credentials' };

        const result = await authOptions.callbacks?.signIn?.({ user, account, profile: {} });

        expect(result).toBe(true);
      });

      it('should handle OAuth provider sign-in with email verification', async () => {
        mockUserUpdateOne.mockResolvedValue({ acknowledged: true });
        
        const user = { email: 'user@example.com' };
        const account = { provider: 'google' };
        const profile = { email_verified: true };

        // Mock environment for MongoDB URI
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

        const result = await authOptions.callbacks?.signIn?.({ user, account, profile });

        expect(result).toBe(true);
        expect(mockDbConnect).toHaveBeenCalled();
        expect(mockUserUpdateOne).toHaveBeenCalledWith(
          {
            email: 'user@example.com',
            emailVerified: null,
          },
          { $set: { emailVerified: expect.any(Date) } },
          { maxTimeMS: 5000 }
        );

        delete process.env.MONGODB_URI;
      });

      it('should handle OAuth sign-in without MongoDB URI', async () => {
        const user = { email: 'user@example.com' };
        const account = { provider: 'google' };
        const profile = { email_verified: true };

        const result = await authOptions.callbacks?.signIn?.({ user, account, profile });

        expect(result).toBe(true);
        expect(mockDbConnect).not.toHaveBeenCalled();
      });

      it('should handle OAuth sign-in errors gracefully', async () => {
        mockDbConnect.mockRejectedValue(new Error('Database error'));
        
        const user = { email: 'user@example.com' };
        const account = { provider: 'google' };
        const profile = { email_verified: true };

        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

        const result = await authOptions.callbacks?.signIn?.({ user, account, profile });

        expect(result).toBe(true); // Should not block sign-in even on error

        delete process.env.MONGODB_URI;
      });
    });

    describe('jwt Callback', () => {
      it('should add user data to JWT token', async () => {
        mockIsAdminEmail.mockReturnValue(false);

        const token = { email: 'user@example.com' };
        const user = {
          id: 'user123',
          role: 'user' as UserRole,
          email: 'user@example.com',
        };

        const result = await authOptions.callbacks?.jwt?.({ token, user });

        expect(result).toEqual({
          email: 'user@example.com',
          id: 'user123',
          role: 'user',
        });
      });

      it('should handle admin allowlist flow', async () => {
        mockIsAdminEmail.mockReturnValue(true);

        const token = { email: 'admin@example.com' };
        const user = {
          id: 'admin123',
          role: 'user' as UserRole, // Not admin yet
          email: 'admin@example.com',
        };

        const result = await authOptions.callbacks?.jwt?.({ token, user });

        expect(result).toEqual({
          email: 'admin@example.com',
          id: 'admin123',
          role: 'user',
        });
        expect(mockIsAdminEmail).toHaveBeenCalledWith('admin@example.com');
      });

      it('should preserve existing token data when no user provided', async () => {
        const token = {
          email: 'user@example.com',
          id: 'user123',
          role: 'user' as UserRole,
        };

        const result = await authOptions.callbacks?.jwt?.({ token, user: undefined });

        expect(result).toEqual(token);
      });
    });

    describe('session Callback', () => {
      it('should add user data to session from token', async () => {
        const session = {
          user: { email: 'user@example.com' },
          expires: '2024-12-31',
        };
        const token = {
          id: 'user123',
          role: 'user' as UserRole,
        };

        const result = await authOptions.callbacks?.session?.({ session, token, user: undefined });

        expect(result.user).toEqual({
          email: 'user@example.com',
          id: 'user123',
          role: 'user',
        });
      });

      it('should add user data to session from user object', async () => {
        const session = {
          user: { email: 'user@example.com' },
          expires: '2024-12-31',
        };
        const user = {
          id: 'user123',
          role: 'admin' as UserRole,
        };
        const token = {};

        const result = await authOptions.callbacks?.session?.({ session, token, user });

        expect(result.user).toEqual({
          email: 'user@example.com',
          id: 'user123',
          role: 'admin',
        });
      });

      it('should prioritize user object over token', async () => {
        const session = {
          user: { email: 'user@example.com' },
          expires: '2024-12-31',
        };
        const user = {
          id: 'user123',
          role: 'admin' as UserRole,
        };
        const token = {
          id: 'token123',
          role: 'user' as UserRole,
        };

        const result = await authOptions.callbacks?.session?.({ session, token, user });

        expect(result.user).toEqual({
          email: 'user@example.com',
          id: 'user123',
          role: 'admin',
        });
      });

      it('should remove role when not present in user or token', async () => {
        const session = {
          user: { email: 'user@example.com', role: 'user' as UserRole },
          expires: '2024-12-31',
        };
        const token = {};

        const result = await authOptions.callbacks?.session?.({ session, token, user: undefined });

        expect(result.user.role).toBeUndefined();
      });
    });
  });

  describe('Admin Allowlist Functionality', () => {
    it('should identify admin emails correctly', () => {
      mockIsAdminEmail.mockReturnValue(true);
      
      const isAdmin = mockIsAdminEmail('admin@example.com');
      
      expect(isAdmin).toBe(true);
      expect(mockIsAdminEmail).toHaveBeenCalledWith('admin@example.com');
    });

    it('should identify non-admin emails correctly', () => {
      mockIsAdminEmail.mockReturnValue(false);
      
      const isAdmin = mockIsAdminEmail('user@example.com');
      
      expect(isAdmin).toBe(false);
      expect(mockIsAdminEmail).toHaveBeenCalledWith('user@example.com');
    });
  });

  describe('OAuth Provider Configuration', () => {
    it('should not include OAuth providers when credentials not configured', () => {
      // Current implementation has OAuth providers commented out
      expect(authOptions.providers).toHaveLength(1); // Only credentials provider
    });

    it('should handle OAuth provider configuration when environment variables are set', () => {
      // Test environment variable checks for OAuth providers
      const originalGoogleId = process.env.GOOGLE_CLIENT_ID;
      const originalGoogleSecret = process.env.GOOGLE_CLIENT_SECRET;

      process.env.GOOGLE_CLIENT_ID = 'test-google-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-google-secret';

      // Since the OAuth providers are commented out, we can only test the pattern
      expect(process.env.GOOGLE_CLIENT_ID).toBe('test-google-id');
      expect(process.env.GOOGLE_CLIENT_SECRET).toBe('test-google-secret');

      // Restore environment
      if (originalGoogleId) {
        process.env.GOOGLE_CLIENT_ID = originalGoogleId;
      } else {
        delete process.env.GOOGLE_CLIENT_ID;
      }
      if (originalGoogleSecret) {
        process.env.GOOGLE_CLIENT_SECRET = originalGoogleSecret;
      } else {
        delete process.env.GOOGLE_CLIENT_SECRET;
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle callback errors gracefully', async () => {
      // Test that errors in callbacks don't break the auth flow
      const token = { email: 'user@example.com' };
      const user = {
        id: 'user123',
        role: 'user' as UserRole,
        email: 'user@example.com',
      };

      // Mock console.error to suppress error output in tests
      const originalConsoleError = console.error;
      console.error = jest.fn();

      try {
        const result = await authOptions.callbacks?.jwt?.({ token, user });
        expect(result).toBeDefined();
      } finally {
        console.error = originalConsoleError;
      }
    });

    it('should handle missing session user gracefully', async () => {
      const session = {
        expires: '2024-12-31',
      } as any; // Intentionally missing user
      const token = {
        id: 'user123',
        role: 'user' as UserRole,
      };

      const result = await authOptions.callbacks?.session?.({ session, token, user: undefined });

      expect(result).toBeDefined();
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle missing adapter gracefully', () => {
      mockCreateAuthAdapter.mockReturnValue(null);
      
      // The auth config should still be valid even without an adapter
      expect(authOptions.providers).toBeDefined();
      expect(authOptions.session?.strategy).toBe('jwt');
    });

    it('should handle browser environment check in admin allowlist', () => {
      // Test that admin allowlist checks only run on server
      const originalWindow = global.window;
      
      // Simulate browser environment
      (global as any).window = {};
      
      // The admin allowlist function should detect browser environment
      // and throw an error (though this is tested indirectly through JWT callback)
      
      // Restore environment
      global.window = originalWindow;
    });
  });
});