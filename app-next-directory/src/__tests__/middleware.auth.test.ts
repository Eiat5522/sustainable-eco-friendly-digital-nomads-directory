import { createMiddleware } from '@/middleware';

// Minimal NextResponse mock
const makeNextResponseMock = () => {
  const events: any[] = [];
  return {
    next: () => ({ type: 'next' }),
    redirect: (url: URL) => ({ type: 'redirect', url: url.toString() }),
    json: (body: any, opts?: any) => ({ type: 'json', body, opts }),
    _events: events
  };
};

describe('middleware auth page redirects', () => {
  test('authenticated user visiting /auth/login is redirected to /dashboard', async () => {
    const getToken = jest.fn().mockResolvedValue({ role: 'user' });
    const NextResponse = makeNextResponseMock();
    const middleware = createMiddleware({ getToken, NextResponse });

    const request: any = {
      nextUrl: { pathname: '/auth/login', origin: 'http://localhost' },
      url: 'http://localhost/auth/login'
    };

    const res = await middleware(request);
    expect(res.type).toBe('redirect');
    expect(res.url).toContain('/dashboard');
  });

  test('authenticated user visiting /auth/signup is redirected to /dashboard', async () => {
    const getToken = jest.fn().mockResolvedValue({ role: 'user' });
    const NextResponse = makeNextResponseMock();
    const middleware = createMiddleware({ getToken, NextResponse });

    const request: any = {
      nextUrl: { pathname: '/auth/signup', origin: 'http://localhost' },
      url: 'http://localhost/auth/signup'
    };

    const res = await middleware(request);
    expect(res.type).toBe('redirect');
    expect(res.url).toContain('/dashboard');
  });

  test('unauthenticated user visiting /auth/login is allowed (next)', async () => {
    const getToken = jest.fn().mockResolvedValue(null);
    const NextResponse = makeNextResponseMock();
    const middleware = createMiddleware({ getToken, NextResponse });

    const request: any = {
      nextUrl: { pathname: '/auth/login', origin: 'http://localhost' },
      url: 'http://localhost/auth/login'
    };

    const res = await middleware(request);
    expect(res.type).toBe('next');
  });
});
