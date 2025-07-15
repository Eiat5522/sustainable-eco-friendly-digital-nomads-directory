// Mock factories for middleware tests

import { NextRequest } from 'next/dist/server/web/spec-extension/request';

export function makeMockRequest(pathname: string): NextRequest {
  return {
    nextUrl: { pathname },
    url: `https://example.com${pathname}`,
  } as unknown as NextRequest;
}

export function makeMockResponse(extra: Record<string, any> = {}) {
  return {
    headers: { set: jest.fn() },
    ...extra,
  };
}

export function makeMockNextResponse() {
  const mockRedirect = jest.fn(() => makeMockResponse());
  const mockNext = jest.fn(() => makeMockResponse());
  const mockJson = jest.fn(() => makeMockResponse());
  return {
    redirect: mockRedirect,
    next: mockNext,
    json: mockJson,
    _mocks: { mockRedirect, mockNext, mockJson },
  };
}