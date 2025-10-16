import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, testControl } from '../route';

describe('/api/revalidate-all', () => {
  const validToken = 'test-token-123';
  const mockedRevalidatePath = jest.fn();
  const originalToken = process.env.revalidationToken;

  beforeEach(async () => {
    process.env.revalidationToken = validToken;
    mockedRevalidatePath.mockReset();
    testControl.revalidatePathOverride = mockedRevalidatePath;
  });

  afterEach(() => {
    process.env.revalidationToken = originalToken;
    testControl.revalidatePathOverride = undefined;
    testControl.tokenOverride = undefined;
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
