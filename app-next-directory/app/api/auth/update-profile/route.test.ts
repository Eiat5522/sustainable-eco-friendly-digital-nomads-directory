import { jest } from '@jest/globals';

// Create mocks with the correct signature before importing
const mockAuth = jest.fn();
const mockUpdateUserProfile = jest.fn();

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
