/**
 * Simplified Next Auth Configuration Test
 *
 * This suite focuses on verifying the overall structure of the authentication
 * configuration without attempting to deeply mock database layers. The tests
 * cover the essential wiring for the credentials provider and key callbacks.
 */

import { authOptions } from '@/lib/auth';
import type { UserRole } from '@/types/auth';

describe('Next Auth Configuration', () => {
  const getCredentialsProvider = () =>
    authOptions.providers?.find((provider: any) => provider?.id === 'credentials') as
      | { authorize?: (credentials: unknown, request?: unknown) => Promise<unknown> | null }
      | undefined;

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
      expect(getCredentialsProvider()).toBeDefined();
    });
  });

  describe('Credentials Provider Basic Flow', () => {
    it('should expose an authorize function', () => {
      const credentialsProvider = getCredentialsProvider();
      expect(typeof credentialsProvider?.authorize).toBe('function');
    });

    it('should handle missing credentials', async () => {
      const credentialsProvider = getCredentialsProvider();
      expect(credentialsProvider).toBeDefined();

      const mockRequest = { headers: { get: () => null } };
      const result = await credentialsProvider?.authorize?.({}, mockRequest);

      expect(result).toBeNull();
    });
  });

  describe('JWT Callback', () => {
    it('should add user data to JWT token', async () => {
      const token = { email: 'user@example.com' };
      const user = {
        id: 'user123',
        name: 'John Doe',
        email: 'user@example.com',
        role: 'user' as UserRole,
      };

      const jwtResult = await authOptions.callbacks?.jwt?.({ token, user } as any);

      expect(jwtResult).toBeDefined();
      expect(jwtResult?.email).toBe('user@example.com');
      expect(jwtResult?.id).toBe('user123');
      expect(jwtResult?.role).toBe('user');
    });

    it('should include token data in the session payload', async () => {
      const session = {
        user: {
          email: 'user@example.com',
          name: 'John Doe',
        },
      };
      const token = {
        email: 'user@example.com',
        id: 'user123',
        role: 'user' as UserRole,
      };

      const sessionResult = await authOptions.callbacks?.session?.({ session, token } as any);

      expect(sessionResult?.user).toBeDefined();
      expect(sessionResult?.user?.email).toBe('user@example.com');
      expect(sessionResult?.user?.id).toBe('user123');
      expect(sessionResult?.user?.role).toBe('user');
    });
  });
});
