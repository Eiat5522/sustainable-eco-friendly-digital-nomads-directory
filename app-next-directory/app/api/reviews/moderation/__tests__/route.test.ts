import { describe, expect, it } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';

describe('/api/reviews/moderation', () => {
  const mockContext = { params: Promise.resolve({}) };

  it('POST returns 501 not implemented', async () => {
    const request = new NextRequest('http://localhost:3000/api/reviews/moderation', {
      method: 'POST',
    });

    const response = await POST(request, mockContext);
    const json = await response.json();

    expect(response.status).toBe(501);
    expect(json.error).toBe('Review moderation API not implemented.');
  });

  it('GET returns 501 not implemented', async () => {
    const request = new NextRequest('http://localhost:3000/api/reviews/moderation');

    const response = await GET(request, mockContext);
    const json = await response.json();

    expect(response.status).toBe(501);
    expect(json.error).toBe('Review moderation API not implemented.');
  });
});
