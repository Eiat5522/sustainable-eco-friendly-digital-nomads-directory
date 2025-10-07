import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMiddleware } from '@/middleware';
import type { UserRole } from '@/types/auth';

type TokenShape = { role?: UserRole } | null;

const createRequest = (pathname: string) => ({
  nextUrl: {
    pathname,
    origin: 'https://example.com',
    searchParams: new URLSearchParams(),
  },
  url: `https://example.com${pathname}`,
  headers: {
    get: jest.fn(),
  },
});

const createNextResponseMocks = () => {
  const createHeaders = () => ({
    set: jest.fn(),
  });

  const buildResponse = <T extends Record<string, unknown>>(type: string, extras: T) => ({
    type,
    headers: createHeaders(),
    ...extras,
  });

  const next = jest.fn(() => buildResponse('next', { status: 200 }));
  const redirect = jest.fn((url: string | URL) =>
    buildResponse('redirect', {
      status: 307,
      url: url instanceof URL ? url.toString() : url,
    }),
  );
  const json = jest.fn((body: unknown, init?: { status?: number }) => {
    const status = init?.status ?? 200;
    return buildResponse('json', {
      status,
      body,
      json: () => Promise.resolve(body),
    });
  });

  return { next, redirect, json };
};

const runMiddleware = async (pathname: string, token: TokenShape) => {
  const nextResponse = createNextResponseMocks();
  const getToken = jest.fn().mockResolvedValue(token);
  const middleware = createMiddleware({ getToken, NextResponse: nextResponse });
  const request = createRequest(pathname);
  const result = await middleware(request);
  return { result, request, getToken, nextResponse };
};

describe('RBAC guardrails integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects unauthenticated users accessing protected pages to the sign-in flow', async () => {
    const { result, nextResponse } = await runMiddleware('/admin', null);

    expect(nextResponse.redirect).toHaveBeenCalledTimes(1);
    expect(result.type).toBe('redirect');
    expect(result.status).toBe(307);
        expect(result.url).toBe('https://example.com/auth/login?callbackUrl=%2Fadmin');
  });

  it('returns a 401 response for unauthenticated admin API requests', async () => {
    const { result, nextResponse } = await runMiddleware('/api/admin/users', null);

    expect(nextResponse.json).toHaveBeenCalledWith(
      { error: 'Authentication required' },
      { status: 401 },
    );
    expect(result.type).toBe('json');
    expect(result.status).toBe(401);
    await expect(result.json()).resolves.toEqual({ error: 'Authentication required' });
  });

  it('prevents a regular user from accessing admin pages', async () => {
    const { result, nextResponse } = await runMiddleware('/admin/users', { role: 'user' });

    expect(nextResponse.redirect).toHaveBeenCalledTimes(1);
    expect(result.type).toBe('redirect');
    expect(result.url).toBe('https://example.com/?error=unauthorized_access');
  });

  it('prevents an editor from accessing admin pages', async () => {
    const { result, nextResponse } = await runMiddleware('/admin/content', { role: 'editor' });

    expect(nextResponse.redirect).toHaveBeenCalledTimes(1);
    expect(result.type).toBe('redirect');
    expect(result.url).toBe('https://example.com/?error=unauthorized_access');
  });

  it('allows an admin to access nested admin pages', async () => {
    const { result, nextResponse } = await runMiddleware('/admin/settings', { role: 'admin' });

    expect(nextResponse.next).toHaveBeenCalledTimes(1);
    expect(result.type).toBe('next');
    expect(result.status).toBe(200);
  });

  it('allows an admin to call protected admin APIs', async () => {
    const { result, nextResponse } = await runMiddleware('/api/admin/audit', { role: 'admin' });

    expect(nextResponse.next).toHaveBeenCalledTimes(1);
    expect(result.type).toBe('next');
    expect(result.status).toBe(200);
  });

  it('returns 403 for elevated roles without admin privileges on admin APIs', async () => {
    const { result, nextResponse } = await runMiddleware('/api/admin/audit', { role: 'editor' });

    expect(nextResponse.json).toHaveBeenCalledWith(
      { error: 'Access denied' },
      { status: 403 },
    );
    expect(result.type).toBe('json');
    expect(result.status).toBe(403);
    await expect(result.json()).resolves.toEqual({ error: 'Access denied' });
  });
});
