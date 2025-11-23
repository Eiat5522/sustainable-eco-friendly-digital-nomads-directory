import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock('@/lib/admin/analytics', () => ({
  __esModule: true,
  fetchModerationQueue: jest.fn(),
  summarizeModerationQueue: jest.fn(),
  performModerationAction: jest.fn(),
}));

const authMockModule = jest.requireMock('@/lib/auth') as { auth: jest.Mock };
const analyticsMockModule = jest.requireMock('@/lib/admin/analytics') as {
  fetchModerationQueue: jest.Mock;
  summarizeModerationQueue: jest.Mock;
  performModerationAction: jest.Mock;
};

let GET: typeof import('../route').GET;
let POST: typeof import('../route').POST;

const mockAuth = authMockModule.auth;
const mockFetchQueue = analyticsMockModule.fetchModerationQueue;
const mockSummarize = analyticsMockModule.summarizeModerationQueue;
const mockPerformAction = analyticsMockModule.performModerationAction;

beforeAll(async () => {
  ({ GET, POST } = await import('../route'));
});

describe('/api/admin/moderation', () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFetchQueue.mockReset();
    mockSummarize.mockReset();
    mockPerformAction.mockReset();
  });

  it('requires admin role for GET', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);
    const request = { url: 'https://example.com/api/admin/moderation' } as any;

    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Admin access required');
    expect(mockFetchQueue).not.toHaveBeenCalled();
  });

  it('returns moderation queue with optional summary', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockFetchQueue.mockResolvedValue([
      {
        id: 'queue-123',
        itemType: 'listing',
        itemName: 'Eco Stay',
        itemId: 'listing-1',
        reports: 2,
        lastActivity: '2024-01-01T00:00:00.000Z',
        status: 'pending',
      },
    ]);
    mockSummarize.mockResolvedValue({ queueSize: 1, oldestItemAgeHours: 12 });

    const request = { url: 'https://example.com/api/admin/moderation?summary=true&limit=5' } as any;
    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.items).toHaveLength(1);
    expect(json.summary).toEqual({ queueSize: 1, oldestItemAgeHours: 12 });
    expect(mockFetchQueue).toHaveBeenCalledWith(5);
  });

  it('falls back to default limit and skips summary when not requested', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockFetchQueue.mockResolvedValue([]);

    const request = { url: 'https://example.com/api/admin/moderation?limit=invalid' } as any;
    const response = await GET(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(200);
    expect(mockFetchQueue).toHaveBeenCalledWith(10);
    expect(mockSummarize).not.toHaveBeenCalled();
  });

  it('returns 500 when fetching the moderation queue fails', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockFetchQueue.mockRejectedValue(new Error('network down'));

    const response = await GET({ url: 'https://example.com/api/admin/moderation' } as any, {
      params: Promise.resolve({}),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to load moderation queue');
  });

  it('rejects missing moderationId on POST', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

    const request = {
      json: () => Promise.resolve({ action: 'approve' }),
    } as any;

    const response = await POST(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('moderationId is required');
  });

  it('requires admin role for POST', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);

    const response = await POST(
      { json: () => Promise.resolve({ moderationId: '1', action: 'approve' }) } as any,
      {
        params: Promise.resolve({}),
      }
    );

    expect(response.status).toBe(403);
    expect(mockPerformAction).not.toHaveBeenCalled();
  });

  it('validates required action fields', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

    const missingAction = await POST(
      { json: () => Promise.resolve({ moderationId: 'queue-1' }) } as any,
      { params: Promise.resolve({}) }
    );
    const missingJson = await missingAction.json();
    expect(missingAction.status).toBe(400);
    expect(missingJson.error).toBe('action is required');

    const unsupported = await POST(
      { json: () => Promise.resolve({ moderationId: 'queue-1', action: 'unknown' }) } as any,
      { params: Promise.resolve({}) }
    );
    const unsupportedJson = await unsupported.json();
    expect(unsupported.status).toBe(400);
    expect(unsupportedJson.error).toMatch(/Unsupported action/);
  });

  it('handles malformed POST bodies and unexpected failures', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

    const malformed = await POST({ json: () => Promise.reject(new Error('parse error')) } as any, {
      params: Promise.resolve({}),
    });
    const malformedJson = await malformed.json();
    expect(malformed.status).toBe(400);
    expect(malformedJson.error).toBe('moderationId is required');

    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockPerformAction.mockRejectedValue(new Error('action failed'));

    const response = await POST(
      { json: () => Promise.resolve({ moderationId: 'queue-1', action: 'approve' }) } as any,
      { params: Promise.resolve({}) }
    );
    const json = await response.json();
    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to process moderation action');
  });

  it('applies moderation action', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'superAdmin', id: 'admin-1' } } as any);
    mockPerformAction.mockResolvedValue({
      id: 'queue-123',
      itemType: 'listing',
      itemName: 'Eco Stay',
      itemId: 'listing-1',
      reports: 0,
      lastActivity: '2024-01-02T00:00:00.000Z',
      status: 'approved',
    });

    const request = {
      json: () => Promise.resolve({ moderationId: 'queue-123', action: 'approve' }),
    } as any;

    const response = await POST(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.message).toBe('Action "approve" applied');
    expect(json.moderation?.status).toBe('approved');
    expect(mockPerformAction).toHaveBeenCalledWith({
      moderationId: 'queue-123',
      action: 'approve',
      notes: undefined,
      actorId: 'admin-1',
    });
  });

  it('defaults actor id when session user id is missing', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockPerformAction.mockResolvedValue({ id: 'queue-1', status: 'flagged' });

    const response = await POST(
      {
        json: () =>
          Promise.resolve({ moderationId: 'queue-1', action: 'flag', notes: 'Check later' }),
      } as any,
      { params: Promise.resolve({}) }
    );

    expect(response.status).toBe(200);
    expect(mockPerformAction).toHaveBeenCalledWith({
      moderationId: 'queue-1',
      action: 'flag',
      notes: 'Check later',
      actorId: 'system',
    });
  });
});
