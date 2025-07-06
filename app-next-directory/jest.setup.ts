// Always load .env.test for all Jest tests
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import '@testing-library/jest-dom';
import 'cross-fetch/polyfill';
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();
import React from 'react';

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
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit
  ) {}
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => []);
}
Object.defineProperty(MockIntersectionObserver, 'prototype', {
  value: MockIntersectionObserver.prototype,
});
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

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
jest.mock('@panva/hkdf', () => ({}));
// Mock next-auth/jwt and getToken for all tests
jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

// Mock preact-render-to-string for ESM errors
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

// Add Jest mocks for 'next-sanity' and '@sanity/image-url'
import { createClient } from 'next-sanity';
import imageUrlBuilder from '@sanity/image-url';

jest.mock('next-sanity', () => ({
  createClient: jest.fn(() => ({
    fetch: jest.fn(),
    getDocument: jest.fn(),
    create: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('@sanity/image-url', () => ({
  default: jest.fn(() => ({
    image: jest.fn(() => ({
      url: jest.fn(() => 'mocked-image-url'),
    })),
  })),
}));
