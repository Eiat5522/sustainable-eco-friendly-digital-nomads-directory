import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Module-level mock for revalidatePath so real Next internals are never called
const mockedRevalidatePath = jest.fn();
jest.mock('next/cache', () => ({ revalidatePath: mockedRevalidatePath }));

// Mock the revalidation token helper
const mockValidateRevalidationToken = jest.fn();
jest.mock('@/utils/revalidation-token', () => ({
  __esModule: true,
  validateRevalidationToken: mockValidateRevalidationToken,
}));

let POST: typeof import('../route').POST;
let routeTestControl: typeof import('../route').routeTestControl;

describe('/api/revalidate-all (clean)', () => {
  const validToken = 'test-token-123';
  const originalToken = process.env.REVALIDATION_TOKEN;

  beforeEach(() => {
    process.env.REVALIDATION_TOKEN = validToken;
    mockedRevalidatePath.mockReset();
    mockValidateRevalidationToken.mockReset();

    jest.resetModules();
    ({ POST, _testControl: routeTestControl } = require('../route'));
    if (routeTestControl) routeTestControl.revalidatePathOverride = mockedRevalidatePath;
  });

  afterEach(() => {
    process.env.REVALIDATION_TOKEN = originalToken;
    if (routeTestControl) routeTestControl.revalidatePathOverride = undefined;
  });

  it('returns 401 when token missing', async () => {
    mockValidateRevalidationToken.mockReturnValue(false);

    const request = new NextRequest('http://localhost:3000/api/revalidate-all');
    const response = await POST(request);
    const json = await response.json();
    expect(response.status).toBe(401);
    expect(json.error).toBe('Invalid token');
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
    expect(mockValidateRevalidationToken).toHaveBeenCalledWith(null);
  });

  it('revalidates with valid token', async () => {
    mockValidateRevalidationToken.mockReturnValue(true);

    const request = new NextRequest(`http://localhost:3000/api/revalidate-all?token=${validToken}`);
    const response = await POST(request);
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.data.revalidated).toBe(true);
    expect(mockedRevalidatePath).toHaveBeenCalled();
    expect(mockValidateRevalidationToken).toHaveBeenCalledWith(validToken);
  });
});
