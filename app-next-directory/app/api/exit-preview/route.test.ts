/**
 * Jest Test Suite for Exit Preview API Route
 * Ensures legacy route redirects to the new preview exit endpoint.
 */

import { jest } from '@jest/globals';

const mockRedirect = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: jest.fn((path: string) => {
    mockRedirect(path);
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

describe('Exit Preview API - GET /api/exit-preview', () => {
  let GET: () => Promise<void>;

  beforeAll(async () => {
    const routeModule = await import('./route');
    GET = routeModule.GET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to the new preview exit endpoint', async () => {
    await expect(GET()).rejects.toThrow('NEXT_REDIRECT:/api/preview/exit');
    expect(mockRedirect).toHaveBeenCalledWith('/api/preview/exit');
  });
});
