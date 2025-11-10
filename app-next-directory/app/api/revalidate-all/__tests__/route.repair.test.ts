import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// Module-level mock for revalidatePath so real Next internals are never called
const mockedRevalidatePath = jest.fn();
jest.mock('next/cache', () => ({ revalidatePath: mockedRevalidatePath }));

let POST: any;
let routeTestControl: any;

describe('/api/revalidate-all (repair)', () => {
  const validToken = 'test-token-123';
  const originalToken = process.env.revalidationToken;

  beforeEach(() => {
    process.env.revalidationToken = validToken;
    mockedRevalidatePath.mockReset();

    jest.resetModules();
    ({ POST, _testControl: routeTestControl } = require('../route'));
    if (routeTestControl) routeTestControl.revalidatePathOverride = mockedRevalidatePath;
  });

  afterEach(() => {
    process.env.revalidationToken = originalToken;
    if (routeTestControl) routeTestControl.revalidatePathOverride = undefined;
  });

  it('returns 401 when token missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/revalidate-all');
    const response = await POST(request);
    const json = await response.json();
    expect(response.status).toBe(401);
    expect(json.error).toBe('Invalid token');
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });

  it('revalidates with valid token', async () => {
    const request = new NextRequest(`http://localhost:3000/api/revalidate-all?token=${validToken}`);
    const response = await POST(request);
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.data.revalidated).toBe(true);
    expect(mockedRevalidatePath).toHaveBeenCalled();
  });
});
