import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { _createProfileHandlers as createProfileHandlers } from './route';

const baseSession = {
  user: {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    image: 'avatar.png',
    role: 'user',
  },
};

type ProfileHandlers = ReturnType<typeof createProfileHandlers>;

describe('/api/user/profile GET', () => {
  let authMock: jest.Mock;
  let getUserByIdMock: jest.Mock;
  let updateUserProfileMock: jest.Mock;
  let handlers: ProfileHandlers;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    authMock = jest.fn().mockResolvedValue({ ...baseSession });
    getUserByIdMock = jest.fn().mockResolvedValue({ ...baseSession.user });
    updateUserProfileMock = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    handlers = createProfileHandlers({
      authFn: authMock as any,
      getUserByIdFn: getUserByIdMock as any,
      updateUserProfileFn: updateUserProfileMock as any,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns 401 when the request is unauthenticated', async () => {
    authMock.mockResolvedValueOnce(null);

    const response = await handlers.GET(new Request('http://localhost/api/user/profile'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Authentication required' });
    expect(getUserByIdMock).not.toHaveBeenCalled();
  });

  it('returns 404 when the user cannot be found', async () => {
    getUserByIdMock.mockResolvedValueOnce(null);

    const response = await handlers.GET(new Request('http://localhost/api/user/profile'));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'User not found' });
  });

  it('returns the user profile when available', async () => {
    const response = await handlers.GET(new Request('http://localhost/api/user/profile'));

    expect(getUserByIdMock).toHaveBeenCalledWith('user-123');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        image: 'avatar.png',
        role: 'user',
      },
    });
  });

  it('returns 500 when an unexpected error occurs', async () => {
    getUserByIdMock.mockRejectedValueOnce(new Error('db failure'));

    const response = await handlers.GET(new Request('http://localhost/api/user/profile'));

    // structuredLogger.error is called, but we don't verify the exact call here
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Internal server error' });
  });
});

describe('/api/user/profile PUT', () => {
  let authMock: jest.Mock;
  let getUserByIdMock: jest.Mock;
  let updateUserProfileMock: jest.Mock;
  let handlers: ProfileHandlers;
  let consoleErrorSpy: jest.SpyInstance;

  const createPutRequest = (body: unknown) =>
    new Request('http://localhost/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  beforeEach(() => {
    authMock = jest.fn().mockResolvedValue({ ...baseSession });
    getUserByIdMock = jest.fn();
    updateUserProfileMock = jest.fn().mockResolvedValue({ ...baseSession.user, name: 'Updated User' });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    handlers = createProfileHandlers({
      authFn: authMock as any,
      getUserByIdFn: getUserByIdMock as any,
      updateUserProfileFn: updateUserProfileMock as any,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns 401 when unauthenticated', async () => {
    authMock.mockResolvedValueOnce(null);

    const response = await handlers.PUT(createPutRequest({ name: 'Updated User' }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Authentication required' });
    expect(updateUserProfileMock).not.toHaveBeenCalled();
  });

  it('validates that name is a non-empty string', async () => {
    const response = await handlers.PUT(createPutRequest({ name: 123 }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Name is required and must be a string',
    });
    expect(updateUserProfileMock).not.toHaveBeenCalled();
  });

  it('returns 500 when the profile update fails', async () => {
    updateUserProfileMock.mockResolvedValueOnce(null);

    const response = await handlers.PUT(createPutRequest({ name: 'Updated User' }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to update profile' });
  });

  it('returns the updated profile on success', async () => {
    const response = await handlers.PUT(
      createPutRequest({ name: 'Updated User', image: 'avatar-new.png' }),
    );

    expect(updateUserProfileMock).toHaveBeenCalledWith('user-123', {
      name: 'Updated User',
      image: 'avatar-new.png',
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: 'user-123',
          name: 'Updated User',
          email: 'test@example.com',
          image: 'avatar.png',
          role: 'user',
        },
      },
    });
  });

  it('returns 500 and logs when an unexpected error occurs', async () => {
    updateUserProfileMock.mockRejectedValueOnce(new Error('db failure'));

    const response = await handlers.PUT(createPutRequest({ name: 'Updated User' }));

    // structuredLogger.error is called, but we don't verify the exact call here
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Internal server error' });
  });
});
