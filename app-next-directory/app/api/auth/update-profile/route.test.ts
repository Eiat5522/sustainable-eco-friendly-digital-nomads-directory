import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';
import type { NextRequest } from 'next/server';

const mockAuth = jest.fn();
const mockUpdateUserProfile = jest.fn();

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: mockAuth,
}));

jest.mock('@/lib/auth/serverAuth', () => ({
  __esModule: true,
  updateUserProfile: mockUpdateUserProfile,
}));

type RouteModule = typeof import('./route');

const createJsonRequest = (body: unknown, method: 'PATCH' | 'POST' = 'PATCH'): NextRequest => {
  const request = new Request('http://localhost/api/auth/update-profile', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

  return request as unknown as NextRequest;
};

const createRawRequest = (rawBody: string, method: 'PATCH' | 'POST' = 'PATCH'): NextRequest => {
  const request = new Request('http://localhost/api/auth/update-profile', {
    method,
    body: rawBody,
    headers: { 'Content-Type': 'application/json' },
  });

  return request as unknown as NextRequest;
};

describe('api/auth/update-profile route', () => {
  let route: RouteModule;
  const originalEnv = { ...process.env };

  beforeAll(async () => {
    route = await import('./route');
  });

  beforeEach(() => {
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://test' } as NodeJS.ProcessEnv;
    mockAuth.mockReset();
    mockUpdateUserProfile.mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv } as NodeJS.ProcessEnv;
    jest.restoreAllMocks();
  });

  it('rejects unsupported GET requests', async () => {
    const response = await route.GET();
    const payload = await response.json();

    expect(response.status).toBe(405);
    expect(payload).toEqual({
      success: false,
      data: null,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Use PATCH to update the profile.',
      },
    });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns service unavailable when MongoDB is not configured', async () => {
    delete process.env.MONGODB_URI;

    const response = await route.PATCH(createJsonRequest({ name: 'Taylor Swift' }));
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.error).toEqual({
      code: 'SERVICE_UNAVAILABLE',
      message: 'Profile updates are currently disabled.',
    });
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(mockAuth).not.toHaveBeenCalled();
  });

  it('enforces authentication', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const response = await route.PATCH(createJsonRequest({ name: 'Taylor Swift' }));
    const payload = await response.json();

    expect(mockAuth).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(401);
    expect(payload.error).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  });

  it('handles malformed JSON bodies', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });

    const response = await route.PATCH(createRawRequest('{"broken"'));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toEqual({
      code: 'INVALID_JSON',
      message: 'Unable to parse request body.',
    });
  });

  it('requires a JSON object body', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });

    const response = await route.PATCH(createJsonRequest('invalid'));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toEqual({
      code: 'INVALID_INPUT',
      message: 'Request body must be a JSON object.',
    });
  });

  it('validates the name field thoroughly', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const cases: Array<{ body: Record<string, unknown>; expected: string }> = [
      { body: { name: 123 }, expected: 'Name must be a string.' },
      { body: { name: '   ' }, expected: 'Name cannot be empty.' },
      {
        body: { name: 'a'.repeat(121) },
        expected: 'Name cannot exceed 120 characters.',
      },
    ];

    for (const testCase of cases) {
      const response = await route.PATCH(createJsonRequest(testCase.body));
      const payload = await response.json();

      expect(response.status).toBe(400);
      expect(payload.error.code).toBe('INVALID_INPUT');
      expect(payload.error.message).toContain(testCase.expected);
    }
  });

  it('validates the image field and requires at least one update field', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

    const noFieldsResponse = await route.PATCH(createJsonRequest({}));
    const noFieldsPayload = await noFieldsResponse.json();

    expect(noFieldsResponse.status).toBe(400);
    expect(noFieldsPayload.error).toEqual({
      code: 'INVALID_INPUT',
      message: 'At least one of name or image must be provided.',
    });

    const invalidImageResponse = await route.PATCH(createJsonRequest({ image: 123 }));
    const invalidImagePayload = await invalidImageResponse.json();

    expect(invalidImageResponse.status).toBe(400);
    expect(invalidImagePayload.error.code).toBe('INVALID_INPUT');
    expect(invalidImagePayload.error.message).toContain('Image must be a string URL or null.');
  });

  it('trims string fields and supports null images', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } });
    const updatedUser = {
      id: 'user-1',
      name: 'Trimmed Name',
      email: 'user@example.com',
      image: undefined,
      role: 'user',
      extra: 'ignored',
    };

    mockUpdateUserProfile.mockResolvedValueOnce(updatedUser);

    const response = await route.PATCH(
      createJsonRequest({ name: '  Trimmed Name  ', image: '  https://image.test/avatar.png  ' })
    );
    const payload = await response.json();

    expect(mockUpdateUserProfile).toHaveBeenCalledWith('user-1', {
      name: 'Trimmed Name',
      image: 'https://image.test/avatar.png',
    });
    expect(response.status).toBe(200);
    expect(payload).toEqual({
      success: true,
      data: {
        user: {
          id: 'user-1',
          name: 'Trimmed Name',
          email: 'user@example.com',
          image: null,
          role: 'user',
        },
      },
      error: null,
    });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('propagates null images to the update operation', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-2' } });
    mockUpdateUserProfile.mockResolvedValueOnce({
      id: 'user-2',
      name: 'Taylor',
      email: 'taylor@example.com',
      image: null,
      role: 'user',
    });

    const response = await route.PATCH(createJsonRequest({ image: null }));
    const payload = await response.json();

    expect(mockUpdateUserProfile).toHaveBeenCalledWith('user-2', { image: null });
    expect(payload.data.user.image).toBeNull();
  });

  it('returns 404 when the user cannot be updated', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-3' } });
    mockUpdateUserProfile.mockResolvedValueOnce(null);

    const response = await route.PATCH(createJsonRequest({ name: 'Taylor' }));
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error).toEqual({
      code: 'NOT_FOUND',
      message: 'User not found or update failed.',
    });
  });

  it('logs and reports server errors', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-4' } });
    const error = new Error('database down');
    mockUpdateUserProfile.mockRejectedValueOnce(error);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await route.PATCH(createJsonRequest({ name: 'Taylor' }));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toEqual({
      code: 'SERVER_ERROR',
      message: 'Failed to update profile.',
    });
    expect(consoleSpy).toHaveBeenCalledWith('Profile update error:', error);
  });

  it('supports POST requests as an alias for PATCH', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-5' } });
    mockUpdateUserProfile.mockResolvedValueOnce({
      id: 'user-5',
      name: 'Alias Name',
      email: 'alias@example.com',
      image: 'avatar.png',
      role: 'admin',
    });

    const response = await route.POST(createJsonRequest({ name: 'Alias Name' }, 'POST'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.user).toEqual({
      id: 'user-5',
      name: 'Alias Name',
      email: 'alias@example.com',
      image: 'avatar.png',
      role: 'admin',
    });
  });
});
