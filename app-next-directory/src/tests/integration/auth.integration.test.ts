import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

type SignInPayload = {
  email: string;
  password: string;
};

type MockFetch = jest.MockedFunction<typeof fetch>;

const buildBaseUrl = (input: string) => input.replace(/\/$/, '');

async function registerUser(baseUrl: string, payload: RegisterPayload) {
  return fetch(`${buildBaseUrl(baseUrl)}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function signInCredentials(baseUrl: string, payload: SignInPayload) {
  return fetch(`${buildBaseUrl(baseUrl)}/api/auth/signin/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function completeCredentialsCallback(baseUrl: string, payload: SignInPayload) {
  return fetch(`${buildBaseUrl(baseUrl)}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function fetchSession(baseUrl: string) {
  return fetch(`${buildBaseUrl(baseUrl)}/api/auth/session`, {
    method: 'GET',
  });
}

describe('Authentication integration with mocked backend contracts', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('register request uses expected payload and contract shape', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        data: {
          user: {
            _id: 'e2e-user',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      }),
    }) as unknown as MockFetch;

    globalThis.fetch = mockFetch;

    const response = await registerUser('http://localhost:3000', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password_123!Aa',
    });

    const body = (await response.json()) as {
      success: boolean;
      data: { user: { _id: string; email: string } };
    };

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password_123!Aa',
      }),
    });
    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.user._id).toBe('e2e-user');
  });

  test('credentials sign-in and callback contracts match e2e mock mode', async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ url: '/' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, url: '/' }),
      }) as unknown as MockFetch;

    globalThis.fetch = mockFetch;

    const credentials = { email: 'test@example.com', password: 'Password_123!Aa' };
    const signInResponse = await signInCredentials('http://localhost:3000', credentials);
    const callbackResponse = await completeCredentialsCallback('http://localhost:3000', credentials);

    expect(mockFetch).toHaveBeenNthCalledWith(1, 'http://localhost:3000/api/auth/signin/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/api/auth/callback/credentials',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      }
    );

    expect(signInResponse.status).toBe(200);
    expect(callbackResponse.status).toBe(200);
  });

  test('session contract returns authenticated user payload', async () => {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: {
          name: 'Test User',
          email: 'test@example.com',
        },
        expires,
      }),
    }) as unknown as MockFetch;

    globalThis.fetch = mockFetch;

    const response = await fetchSession('http://localhost:3000');
    const data = (await response.json()) as {
      user: { name: string; email: string };
      expires: string;
    };

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/auth/session', {
      method: 'GET',
    });
    expect(data.user.email).toBe('test@example.com');
    expect(data.expires).toBe(expires);
  });
});
