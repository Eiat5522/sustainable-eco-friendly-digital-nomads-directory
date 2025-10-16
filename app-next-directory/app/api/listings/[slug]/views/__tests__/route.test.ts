import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('@/lib/metrics/listing-views', () => ({
  __esModule: true,
  recordListingView: jest.fn(),
}));

const metricsMock = jest.requireMock('@/lib/metrics/listing-views') as {
  recordListingView: jest.Mock;
};

let POST: typeof import('../route').POST;

const parseResponse = async (response: Response) => ({
  status: response.status,
  body: await response.json(),
});

beforeAll(async () => {
  ({ POST } = await import('../route'));
});

beforeEach(() => {
  metricsMock.recordListingView.mockReset();
});

describe('API /api/listings/[slug]/views - POST', () => {
  it('records a listing view with provided timestamp metadata', async () => {
    const viewedAt = '2024-01-01T12:30:00.000Z';
    const request = new Request('http://localhost/api/listings/eco-hub/views', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ viewedAt }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ slug: 'eco-hub' }),
    });
    const { status, body } = await parseResponse(response);

    expect(status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(metricsMock.recordListingView).toHaveBeenCalledWith(
      'eco-hub',
      expect.any(Date)
    );

    const [, timestamp] = metricsMock.recordListingView.mock.calls[0];
    expect((timestamp as Date).toISOString()).toBe(viewedAt);
  });

  it('falls back to the current time when timestamp is missing', async () => {
    const request = new Request('http://localhost/api/listings/eco-hub/views', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request, {
      params: Promise.resolve({ slug: 'eco-hub' }),
    });
    const { status, body } = await parseResponse(response);

    expect(status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(metricsMock.recordListingView).toHaveBeenCalledTimes(1);
    const [, timestamp] = metricsMock.recordListingView.mock.calls[0];
    expect(timestamp).toBeInstanceOf(Date);
    expect(Number.isNaN((timestamp as Date).getTime())).toBe(false);
  });

  it('ignores invalid timestamp values and uses the current time', async () => {
    const request = new Request('http://localhost/api/listings/eco-hub/views', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ viewedAt: 'not-a-date' }),
    });

    const response = await POST(request, {
      params: Promise.resolve({ slug: 'eco-hub' }),
    });
    const { status, body } = await parseResponse(response);

    expect(status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(metricsMock.recordListingView).toHaveBeenCalledTimes(1);
    const [, timestamp] = metricsMock.recordListingView.mock.calls[0];
    expect(timestamp).toBeInstanceOf(Date);
    expect(Number.isNaN((timestamp as Date).getTime())).toBe(false);
  });

  it('gracefully handles invalid JSON payloads', async () => {
    const request = new Request('http://localhost/api/listings/eco-hub/views', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    });

    const response = await POST(request, {
      params: Promise.resolve({ slug: 'eco-hub' }),
    });
    const { status, body } = await parseResponse(response);

    expect(status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(metricsMock.recordListingView).toHaveBeenCalledWith(
      'eco-hub',
      expect.any(Date)
    );
  });

  it('returns validation error when slug is missing', async () => {
    const request = new Request('http://localhost/api/listings//views', {
      method: 'POST',
    });

    const response = await POST(request, {
      params: Promise.resolve({ slug: '' }),
    });
    const { status, body } = await parseResponse(response);

    expect(status).toBe(400);
    expect(body).toEqual({ error: 'Listing slug is required' });
    expect(metricsMock.recordListingView).not.toHaveBeenCalled();
  });

  it('returns server error when recording the view fails', async () => {
    metricsMock.recordListingView.mockRejectedValueOnce(new Error('database offline'));

    const request = new Request('http://localhost/api/listings/eco-hub/views', {
      method: 'POST',
    });

    const response = await POST(request, {
      params: Promise.resolve({ slug: 'eco-hub' }),
    });
    const { status, body } = await parseResponse(response);

    expect(status).toBe(500);
    expect(body).toEqual({ error: 'Failed to record view' });
  });
});
