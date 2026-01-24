import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock dependencies
jest.mock('@/lib/auth');

import * as authModule from '@/lib/auth';
const mockAuthModule = jest.mocked(authModule);

describe('/api/debug-env', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET', () => {
    it('should return 404 in production when not E2E', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.E2E;
      delete process.env.NEXT_PUBLIC_E2E;

      // Clear module cache to force reimport with new env
      jest.resetModules();
      const { GET } = await import('../route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Not available');
    });

    it('should return 401 for non-admin in non-E2E mode', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.E2E;
      delete process.env.NEXT_PUBLIC_E2E;

      mockAuthModule.auth.mockResolvedValue({
        user: { id: 'user-1', role: 'user' },
      } as any);

      const { GET } = await import('../route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return masked env variables for admin in non-E2E mode', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.E2E;
      delete process.env.NEXT_PUBLIC_E2E;
      process.env.NEXTAUTH_SECRET = 'secret123';
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'project123';
      process.env.NEXT_PUBLIC_SANITY_DATASET = 'production';
      process.env.SANITY_API_TOKEN = 'token123';

      mockAuthModule.auth.mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);

      const { GET } = await import('../route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.NEXTAUTH_SECRET).toBe('[SET]');
      expect(data.NEXT_PUBLIC_SANITY_PROJECT_ID).toBe('project123');
      expect(data.NEXT_PUBLIC_SANITY_DATASET).toBe('production');
      expect(data.SANITY_API_TOKEN).toBe('[SET]');
    });

    it('should return unmasked env variables in E2E mode with E2E=1', async () => {
      process.env.NODE_ENV = 'development';
      process.env.E2E = '1';
      delete process.env.NEXT_PUBLIC_E2E;
      process.env.NEXTAUTH_SECRET = 'secret123';
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'project123';
      process.env.NEXT_PUBLIC_SANITY_DATASET = 'production';
      process.env.SANITY_API_TOKEN = 'token123';

      jest.resetModules();
      const { GET } = await import('../route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.NEXTAUTH_SECRET).toBe('secret123');
      expect(data.NEXT_PUBLIC_SANITY_PROJECT_ID).toBe('project123');
      expect(data.NEXT_PUBLIC_SANITY_DATASET).toBe('production');
      expect(data.SANITY_API_TOKEN).toBe('token123');
    });

    it('should return unmasked env variables in E2E mode with NEXT_PUBLIC_E2E=1', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.E2E;
      process.env.NEXT_PUBLIC_E2E = '1';
      process.env.NEXTAUTH_SECRET = 'secret456';
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'project456';
      process.env.NEXT_PUBLIC_SANITY_DATASET = 'test';
      process.env.SANITY_API_TOKEN = 'token456';

      jest.resetModules();
      const { GET } = await import('../route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.NEXTAUTH_SECRET).toBe('secret456');
      expect(data.NEXT_PUBLIC_SANITY_PROJECT_ID).toBe('project456');
      expect(data.NEXT_PUBLIC_SANITY_DATASET).toBe('test');
      expect(data.SANITY_API_TOKEN).toBe('token456');
    });

    it('should handle missing env variables in admin mode', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.E2E;
      delete process.env.NEXT_PUBLIC_E2E;
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
      delete process.env.NEXT_PUBLIC_SANITY_DATASET;
      delete process.env.SANITY_API_TOKEN;

      mockAuthModule.auth.mockResolvedValue({
        user: { id: 'admin-1', role: 'admin' },
      } as any);

      const { GET } = await import('../route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.NEXTAUTH_SECRET).toBe('[NOT SET]');
      expect(data.NEXT_PUBLIC_SANITY_PROJECT_ID).toBeUndefined();
      expect(data.NEXT_PUBLIC_SANITY_DATASET).toBeUndefined();
      expect(data.SANITY_API_TOKEN).toBe('[NOT SET]');
    });

    it('should handle missing env variables in E2E mode', async () => {
      process.env.NODE_ENV = 'development';
      process.env.E2E = '1';
      delete process.env.NEXT_PUBLIC_E2E;
      delete process.env.NEXTAUTH_SECRET;
      delete process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
      delete process.env.NEXT_PUBLIC_SANITY_DATASET;
      delete process.env.SANITY_API_TOKEN;

      jest.resetModules();
      const { GET } = await import('../route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.NEXTAUTH_SECRET).toBe('');
      expect(data.NEXT_PUBLIC_SANITY_PROJECT_ID).toBe('');
      expect(data.NEXT_PUBLIC_SANITY_DATASET).toBe('');
      expect(data.SANITY_API_TOKEN).toBe('');
    });

    it('should allow E2E mode in production when E2E flag is set', async () => {
      process.env.NODE_ENV = 'production';
      process.env.E2E = '1';
      delete process.env.NEXT_PUBLIC_E2E;
      process.env.NEXTAUTH_SECRET = 'prod-secret';
      process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'prod-project';
      process.env.NEXT_PUBLIC_SANITY_DATASET = 'production';
      process.env.SANITY_API_TOKEN = 'prod-token';

      jest.resetModules();
      const { GET } = await import('../route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.NEXTAUTH_SECRET).toBe('prod-secret');
      expect(data.NEXT_PUBLIC_SANITY_PROJECT_ID).toBe('prod-project');
      expect(data.NEXT_PUBLIC_SANITY_DATASET).toBe('production');
      expect(data.SANITY_API_TOKEN).toBe('prod-token');
    });

    it('should handle venueOwner role as non-admin', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.E2E;
      delete process.env.NEXT_PUBLIC_E2E;

      mockAuthModule.auth.mockResolvedValue({
        user: { id: 'venue-1', role: 'venueOwner' },
      } as any);

      const { GET } = await import('../route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
