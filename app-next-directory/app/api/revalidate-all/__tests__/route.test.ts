import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import * as nextCache from 'next/cache';

// Mock next/cache module
jest.mock('next/cache');

describe('/api/revalidate-all', () => {
  const validToken = 'test-token-123';
  const mockedRevalidatePath = nextCache.revalidatePath as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.revalidationToken = validToken;
  });

  it('returns 401 when token is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/revalidate-all');
    
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Invalid token');
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/revalidate-all?token=wrong-token');
    
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Invalid token');
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });

  it('revalidates all routes with valid token', async () => {
    const request = new NextRequest(`http://localhost:3000/api/revalidate-all?token=${validToken}`);
    
    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data.revalidated).toBe(true);
    expect(json.data.routes).toEqual(['/', '/listings', '/category', '/city']);
    expect(json.data.now).toBeDefined();
    expect(mockedRevalidatePath).toHaveBeenCalledTimes(4);
    expect(mockedRevalidatePath).toHaveBeenCalledWith('/');
    expect(mockedRevalidatePath).toHaveBeenCalledWith('/listings');
    expect(mockedRevalidatePath).toHaveBeenCalledWith('/category');
    expect(mockedRevalidatePath).toHaveBeenCalledWith('/city');
  });

});
