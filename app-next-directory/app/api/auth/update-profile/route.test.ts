import { jest } from '@jest/globals';

// Create mocks with the correct signature before importing
import type { updateUserProfile as UpdateUserProfileFn } from '@/lib/auth/serverAuth';

const mockUpdateUserProfile = jest.fn<
  ReturnType<UpdateUserProfileFn>,
  Parameters<UpdateUserProfileFn>
>();
const mockAuth = jest.fn();

// Explicitly mock these modules before importing
jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: mockAuth,
  authOptions: {},
  getToken: jest.fn(),
}));

jest.mock('@/lib/auth/serverAuth', () => ({
  __esModule: true,
  authenticateUser: jest.fn(),
  createUserAccount: jest.fn(),
  getUserById: jest.fn(),
  updateUserRole: jest.fn(),
  updateUserProfile: mockUpdateUserProfile,
}));

import { PATCH, POST, GET } from './route';

const originalEnv = { ...process.env };

const createRequest = (payload?: unknown, method: 'PATCH' | 'POST' | 'GET' = 'PATCH') => {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (payload !== undefined) {
    init.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  }
  return new Request('http://localhost/api/auth/update-profile', init);
};

describe('auth/update-profile route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, MONGODB_URI: 'mongodb://example.com' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects unauthenticated requests with 401', async () => {
    mockAuth.mockResolvedValue(null as any);

    const response = await PATCH(createRequest({ name: 'Tester' }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error?.code).toBe('UNAUTHORIZED');
  });

  it('returns 503 when database configuration is missing', async () => {
    process.env = { ...originalEnv };
    delete process.env.MONGODB_URI;
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);

    const response = await PATCH(createRequest({ name: 'Tester' }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error?.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('handles invalid JSON payloads with 400', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);

    const response = await PATCH(createRequest('{"badJson"'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error?.code).toBe('INVALID_JSON');
  });

  it('validates input fields and returns 400 for invalid data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);

    const response = await PATCH(createRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error?.code).toBe('INVALID_INPUT');
  });

  it('rejects sessions that lack a user id', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);

    const response = await PATCH(createRequest({ name: 'Tester' }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error?.code).toBe('UNAUTHORIZED');
  });

  it('rejects payloads that are not JSON objects', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);

    const response = await PATCH(createRequest('"plain-string"'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error?.code).toBe('INVALID_INPUT');
  });

  it('validates name to be a non-empty string within the limit', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);

    const invalidType = await PATCH(createRequest({ name: 123 }));
    expect(invalidType.status).toBe(400);
    await expect(invalidType.json()).resolves.toEqual(
      expect.objectContaining({ error: expect.objectContaining({ code: 'INVALID_INPUT' }) })
    );

    const emptyName = await PATCH(createRequest({ name: '   ' }));
    expect(emptyName.status).toBe(400);

    const longName = 'a'.repeat(121);
    const tooLong = await PATCH(createRequest({ name: longName }));
    const longBody = await tooLong.json();
    expect(tooLong.status).toBe(400);
    expect(longBody.error?.message).toMatch(/120/);
  });

  it('validates image to be a string URL or null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);

    const invalidImage = await PATCH(createRequest({ image: 123 }));
    const invalidBody = await invalidImage.json();
    expect(invalidImage.status).toBe(400);
    expect(invalidBody.error?.code).toBe('INVALID_INPUT');
  });

  it('trims provided fields before updating the profile', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockUpdateUserProfile.mockResolvedValue({
      id: 'user-1',
      name: 'New Name',
      email: 'user@example.com',
      image: 'https://example.com/img.png',
      role: 'user',
    });

    const response = await PATCH(
      createRequest({ name: '  New Name  ', image: '  https://example.com/img.png  ' })
    );
    const body = await response.json();

    expect(mockUpdateUserProfile).toHaveBeenCalledWith('user-1', {
      name: 'New Name',
      image: 'https://example.com/img.png',
    });
    expect(body.data?.user).toMatchObject({ name: 'New Name', image: 'https://example.com/img.png' });
  });

  it('allows null image updates and sanitizes missing properties', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockUpdateUserProfile.mockResolvedValue({
      id: 'user-1',
      name: 'Updated',
      email: 'user@example.com',
      role: 'user',
    });

    const response = await PATCH(createRequest({ image: null }));
    const body = await response.json();

    expect(mockUpdateUserProfile).toHaveBeenCalledWith('user-1', { image: null });
    expect(body.data?.user).toMatchObject({ image: null });
  });

  it('returns 500 when profile update throws an error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockUpdateUserProfile.mockRejectedValue(new Error('update failed'));

    const response = await PATCH(createRequest({ name: 'Boom' }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error?.code).toBe('SERVER_ERROR');
    expect(body.error?.message).toBe('Failed to update profile.');
  });

  it('returns 404 when the user cannot be updated', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockUpdateUserProfile.mockResolvedValue(null as any);

    const response = await PATCH(createRequest({ name: 'Tester' }));
    const body = await response.json();

    expect(mockUpdateUserProfile).toHaveBeenCalledWith('user-1', { name: 'Tester' });
    expect(response.status).toBe(404);
    expect(body.error?.code).toBe('NOT_FOUND');
  });

  it('updates the user profile via PATCH', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockUpdateUserProfile.mockResolvedValue({
      id: 'user-1',
      name: 'Updated User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.png',
      role: 'user',
    });

    const response = await PATCH(createRequest({ name: 'Updated User' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data?.user).toMatchObject({
      id: 'user-1',
      name: 'Updated User',
      email: 'test@example.com',
    });
  });

  it('treats POST the same as PATCH for updates', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as any);
    mockUpdateUserProfile.mockResolvedValue({
      id: 'user-1',
      name: 'Updated User',
      email: 'test@example.com',
      image: null,
      role: 'user',
    });

    const response = await POST(createRequest({ image: null }, 'POST'));
    const body = await response.json();

    expect(mockUpdateUserProfile).toHaveBeenCalledWith('user-1', { image: null });
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('rejects GET requests with 405', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body.error?.code).toBe('METHOD_NOT_ALLOWED');
  });
});
