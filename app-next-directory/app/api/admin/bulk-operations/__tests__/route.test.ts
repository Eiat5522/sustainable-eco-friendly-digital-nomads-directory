import { describe, it, expect, jest, beforeEach, beforeAll } from '@jest/globals';

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock('@/lib/admin/analytics', () => ({
  __esModule: true,
  runBulkOperation: jest.fn(),
}));

import { auth } from '@/lib/auth';
import { runBulkOperation } from '@/lib/admin/analytics';

const authMockModule = jest.requireMock('@/lib/auth') as { auth: jest.Mock };
const analyticsMockModule = jest.requireMock('@/lib/admin/analytics') as {
  runBulkOperation: jest.Mock;
};

let GET: typeof import('../route').GET;
let POST: typeof import('../route').POST;

const mockAuth = authMockModule.auth;
const mockRunBulk = analyticsMockModule.runBulkOperation;

beforeAll(async () => {
  ({ GET, POST } = await import('../route'));
});

describe('/api/admin/bulk-operations', () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockRunBulk.mockReset();
  });


  it('requires admin for GET', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);

    const response = await GET({} as any, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Admin access required');
  });

  it('lists available operations', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

    const response = await GET({} as any, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(json.operations)).toBe(true);
    expect(json.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'publishListings' }),
      ])
    );
  });

  it('rejects unsupported operation', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

    const request = {
      json: () => Promise.resolve({ operation: 'unknown', ids: ['1'] }),
    } as any;

    const response = await POST(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toMatch(/Unsupported operation/);
  });

  it('runs bulk operation', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'superAdmin' } } as any);
    mockRunBulk.mockResolvedValue({
      operation: 'publishListings',
      total: 2,
      succeeded: 2,
      failed: [],
    });

    const request = {
      json: () => Promise.resolve({ operation: 'publishListings', ids: ['listing-1', 'listing-2'] }),
    } as any;

    const response = await POST(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.result.succeeded).toBe(2);
    expect(mockRunBulk).toHaveBeenCalledWith({
      operation: 'publishListings',
      ids: ['listing-1', 'listing-2'],
    });
  });
});
