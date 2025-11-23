import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock('@/lib/admin/analytics', () => ({
  __esModule: true,
  runBulkOperation: jest.fn(),
}));

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

  it('returns 500 if fetching operations throws', async () => {
    mockAuth.mockRejectedValue(new Error('auth fail'));

    const response = await GET({} as any, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to load bulk operation metadata');
  });

  it('lists available operations', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

    const response = await GET({} as any, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(json.operations)).toBe(true);
    expect(json.operations).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'publishListings' })])
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

  it('requires authentication and validates payload', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);

    const forbidden = await POST(
      { json: () => Promise.resolve({ operation: 'publishListings', ids: ['1'] }) } as any,
      {
        params: Promise.resolve({}),
      }
    );
    expect(forbidden.status).toBe(403);

    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    const missingOperation = await POST({ json: () => Promise.resolve({ ids: ['1'] }) } as any, {
      params: Promise.resolve({}),
    });
    const missingOperationJson = await missingOperation.json();
    expect(missingOperation.status).toBe(400);
    expect(missingOperationJson.error).toBe('operation is required');

    const missingIds = await POST(
      { json: () => Promise.resolve({ operation: 'publishListings', ids: [] }) } as any,
      {
        params: Promise.resolve({}),
      }
    );
    const missingIdsJson = await missingIds.json();
    expect(missingIds.status).toBe(400);
    expect(missingIdsJson.error).toMatch(/ids must contain at least one/);
  });

  it('limits the number of ids and filters invalid entries', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

    const overLimitIds = Array.from({ length: 1001 }, (_, i) => `id-${i}`);
    const overLimit = await POST(
      { json: () => Promise.resolve({ operation: 'publishListings', ids: overLimitIds }) } as any,
      {
        params: Promise.resolve({}),
      }
    );
    const overLimitJson = await overLimit.json();
    expect(overLimit.status).toBe(400);
    expect(overLimitJson.error).toMatch(/maximum length/);

    const request = {
      json: () =>
        Promise.resolve({ operation: 'publishListings', ids: ['  listing-1  ', '', 'listing-2'] }),
    } as any;
    mockRunBulk.mockResolvedValue({
      operation: 'publishListings',
      total: 2,
      succeeded: 2,
      failed: [],
    });
    const response = await POST(request, { params: Promise.resolve({}) });
    expect(response.status).toBe(200);
    expect(mockRunBulk).toHaveBeenCalledWith({
      operation: 'publishListings',
      ids: ['  listing-1  ', 'listing-2'],
    });
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
      json: () =>
        Promise.resolve({ operation: 'publishListings', ids: ['listing-1', 'listing-2'] }),
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

  it('handles bulk operation failures and malformed requests', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

    const malformed = await POST({ json: () => Promise.reject(new Error('parse error')) } as any, {
      params: Promise.resolve({}),
    });
    const malformedJson = await malformed.json();
    expect(malformed.status).toBe(400);
    expect(malformedJson.error).toBe('operation is required');

    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockRunBulk.mockRejectedValue(new Error('bulk failure'));
    const response = await POST(
      { json: () => Promise.resolve({ operation: 'publishListings', ids: ['listing-1'] }) } as any,
      { params: Promise.resolve({}) }
    );
    const json = await response.json();
    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to run bulk operation');
  });
});
