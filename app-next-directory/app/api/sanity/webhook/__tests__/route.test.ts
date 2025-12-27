import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextRequest } from 'next/server';

const mockRevalidateTag = jest.fn();
jest.mock('next/cache', () => ({
  __esModule: true,
  revalidateTag: mockRevalidateTag,
}));

const mockStructuredLogger = {
  error: jest.fn(),
};
jest.mock('@/lib/logger', () => ({
  __esModule: true,
  structuredLogger: mockStructuredLogger,
}));

const mockValidateRevalidationToken = jest.fn();
jest.mock('@/utils/revalidation-token', () => ({
  __esModule: true,
  validateRevalidationToken: mockValidateRevalidationToken,
}));

let POST: typeof import('../route').POST;

describe('Sanity Webhook API - POST /api/sanity/webhook', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockRevalidateTag.mockImplementation(() => {});
    const routeModule = await import('../route');
    POST = routeModule.POST;
  });

  it('revalidates home and listing tags for listing updates', async () => {
    mockValidateRevalidationToken.mockReturnValue(true);

    const request = {
      method: 'POST',
      headers: new Map([['x-sanity-webhook-token', 'test-token']]),
      json: jest.fn(async () => ({ _type: 'listing' })),
    } as unknown as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.tags).toEqual(expect.arrayContaining(['home', 'featured-listings']));
    expect(mockRevalidateTag).toHaveBeenCalledWith('home', 'max');
    expect(mockRevalidateTag).toHaveBeenCalledWith('featured-listings', 'max');
  });

  it('revalidates home and city tags for city updates', async () => {
    mockValidateRevalidationToken.mockReturnValue(true);

    const request = {
      method: 'POST',
      headers: new Map([['x-sanity-webhook-token', 'test-token']]),
      json: jest.fn(async () => ({ document: { _type: 'city' } })),
    } as unknown as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.tags).toEqual(expect.arrayContaining(['home', 'cities']));
    expect(mockRevalidateTag).toHaveBeenCalledWith('home', 'max');
    expect(mockRevalidateTag).toHaveBeenCalledWith('cities', 'max');
  });

  it('returns 401 when token is invalid', async () => {
    mockValidateRevalidationToken.mockReturnValue(false);

    const request = {
      method: 'POST',
      headers: new Map([['x-sanity-webhook-token', 'bad-token']]),
      json: jest.fn(async () => ({ _type: 'listing' })),
    } as unknown as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });

  it('still revalidates home for unknown types', async () => {
    mockValidateRevalidationToken.mockReturnValue(true);

    const request = {
      method: 'POST',
      headers: new Map([['x-sanity-webhook-token', 'test-token']]),
      json: jest.fn(async () => ({ _type: 'unknown' })),
    } as unknown as NextRequest;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.tags).toEqual(['home']);
    expect(mockRevalidateTag).toHaveBeenCalledWith('home', 'max');
  });
});
