import { describe, it, expect, jest, beforeEach, beforeAll } from '@jest/globals';

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock('@/lib/admin/analytics', () => ({
  __esModule: true,
  analyzeContent: jest.fn(),
}));

import { auth } from '@/lib/auth';
import { analyzeContent } from '@/lib/admin/analytics';

const authMockModule = jest.requireMock('@/lib/auth') as { auth: jest.Mock };
const analyticsMockModule = jest.requireMock('@/lib/admin/analytics') as {
  analyzeContent: jest.Mock;
};

let GET: typeof import('../route').GET;
let POST: typeof import('../route').POST;

const mockAuth = authMockModule.auth;
const mockAnalyze = analyticsMockModule.analyzeContent;

beforeAll(async () => {
  ({ GET, POST } = await import('../route'));
});

describe('/api/admin/analyze-content', () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockAnalyze.mockReset();
  });


  it('requires admin for GET', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);

    const request = { url: 'https://example.com/api/admin/analyze-content' } as any;
    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.error).toBe('Admin access required');
  });

  it('returns analysis snapshot', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockAnalyze.mockResolvedValue({
      type: 'listing',
      totals: { all: 10, flagged: 1, pendingModeration: 2, publishedLastWindow: 3 },
      averages: { reportsPerItem: 0.3 },
    });

    const request = { url: 'https://example.com/api/admin/analyze-content?type=listing&windowDays=14' } as any;
    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.analysis.type).toBe('listing');
    expect(mockAnalyze).toHaveBeenCalledWith({ type: 'listing', windowDays: 14 });
  });

  it('defaults to listing type when query params are missing', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockAnalyze.mockResolvedValue({ type: 'listing' });

    const request = { url: 'https://example.com/api/admin/analyze-content' } as any;
    const response = await GET(request, { params: Promise.resolve({}) });

    expect(response.status).toBe(200);
    expect(mockAnalyze).toHaveBeenCalledWith({ type: 'listing', windowDays: undefined });
  });

  it('rejects invalid windowDays values', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

    const request = { url: 'https://example.com/api/admin/analyze-content?windowDays=0' } as any;
    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('windowDays must be a positive integer');
    expect(mockAnalyze).not.toHaveBeenCalled();
  });

  it('returns 500 when the analyze service fails during GET', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);
    mockAnalyze.mockRejectedValue(new Error('service down'));

    const request = { url: 'https://example.com/api/admin/analyze-content' } as any;
    const response = await GET(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Failed to analyze content');
  });

  it('rejects POST without samples', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

    const request = {
      json: () => Promise.resolve({ type: 'listing' }),
    } as any;

    const response = await POST(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('samples must contain at least one text item');
  });

  it('scores submitted text samples', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'superAdmin' } } as any);

    const request = {
      json: () =>
        Promise.resolve({
          type: 'review',
          samples: [
            { id: 'a', text: 'Great stay' },
            { id: 'b', text: 'This is a scam listing' },
          ],
        }),
    } as any;

    const response = await POST(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.total).toBe(2);
    expect(json.insights.find((item: any) => item.id === 'b').riskLevel).toBe('medium');
  });

  it('flags multiple keywords as high risk and deduplicates matches', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

    const request = {
      json: () =>
        Promise.resolve({
          samples: [{ id: 'sample', text: 'Spam spam! Possible scam in this listing.' }],
        }),
    } as any;

    const response = await POST(request, { params: Promise.resolve({}) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.insights[0].flaggedKeywords).toEqual(['spam', 'scam']);
    expect(json.insights[0].riskLevel).toBe('high');
  });

  it('handles malformed POST bodies and authorization issues', async () => {
    mockAuth.mockResolvedValue({ user: { role: 'admin' } } as any);

    const malformed = await POST({ json: () => Promise.reject(new Error('nope')) } as any, {
      params: Promise.resolve({}),
    });
    expect(malformed.status).toBe(400);

    mockAuth.mockResolvedValue({ user: { role: 'user' } } as any);
    const forbidden = await POST({ json: () => Promise.resolve({ samples: [{ id: '1', text: 'ok' }] }) } as any, {
      params: Promise.resolve({}),
    });
    expect(forbidden.status).toBe(403);

    mockAuth.mockRejectedValue(new Error('auth failed'));
    const errorResponse = await POST({ json: () => Promise.resolve({ samples: [{ id: '2', text: 'spam' }] }) } as any, {
      params: Promise.resolve({}),
    });
    const errorJson = await errorResponse.json();
    expect(errorResponse.status).toBe(500);
    expect(errorJson.error).toBe('Failed to analyze content samples');
  });
});
