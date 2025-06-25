import '@testing-library/jest-dom';
import 'cross-fetch/polyfill';

// Polyfill for Request/Response for Jest (Node.js)
if (typeof global.Request === 'undefined') {
  // @ts-ignore
  global.Request = fetch.Request;
}
if (typeof global.Response === 'undefined') {
  // @ts-ignore
  global.Response = fetch.Response;
}

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
})

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

/**
 * Mock ESM-only modules to avoid Jest ESM transform errors.
 */
jest.mock('jose', () => ({}));
jest.mock('node-fetch', () => ({}));
jest.mock('nanoid', () => ({ nanoid: () => 'mocked-nanoid' }));
jest.mock('@sanity/client', () => ({}));
jest.mock('@panva/hkdf', () => ({}));
// Mock next-auth/jwt and getToken for all tests
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock preact-render-to-string for ESM errors
jest.mock('@sanity/client');
jest.mock('preact-render-to-string', () => ({
  render: () => '',
  renderToStaticMarkup: () => '',
  renderToString: () => '',
  shallowRender: () => '',
}));

jest.mock('uuid', () => ({
  v1: () => 'mocked-uuid-v1',
  v4: () => 'mocked-uuid-v4',
  v5: () => 'mocked-uuid-v5',
  NIL: 'mocked-uuid-nil',
  version: () => 4,
  validate: () => true,
  stringify: () => 'mocked-uuid-string',
  parse: () => [],
}));

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
