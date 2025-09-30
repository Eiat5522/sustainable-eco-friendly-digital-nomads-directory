jest.mock('@/lib/metrics/listing-views', () => ({
  recordListingView: jest.fn(),
}));

import { POST } from '../../../../app/api/listings/[slug]/views/route';
import { recordListingView } from '@/lib/metrics/listing-views';

describe('POST /api/listings/[slug]/views', () => {
  const mockRecord = recordListingView as jest.MockedFunction<typeof recordListingView>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects requests without a slug', async () => {
    const request = new Request('http://localhost/api/listings//views', { method: 'POST' });

  const response = await POST(request as any, { params: { slug: '' } });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Listing slug is required' });
    expect(mockRecord).not.toHaveBeenCalled();
  });

  it('records a view using the current timestamp when no body is provided', async () => {
    mockRecord.mockResolvedValueOnce();
    const request = new Request('http://localhost/api/listings/listing-123/views', { method: 'POST' });

  const response = await POST(request as any, { params: { slug: 'listing-123' } });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockRecord).toHaveBeenCalledWith('listing-123', expect.any(Date));
  });

  it('honours a client-supplied viewedAt timestamp', async () => {
    mockRecord.mockResolvedValueOnce();
    const iso = '2024-07-21T10:15:00.000Z';
    const request = new Request('http://localhost/api/listings/listing-999/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viewedAt: iso }),
    });

  const response = await POST(request as any, { params: { slug: 'listing-999' } });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mockRecord).toHaveBeenCalledWith('listing-999', new Date(iso));
  });
});
