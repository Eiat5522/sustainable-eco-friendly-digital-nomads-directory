import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock isSanityConfigured
jest.mock('@/lib/sanity/env', () => ({
  isSanityConfigured: jest.fn().mockReturnValue(true),
}));

// Mock getCityBySlug
jest.mock('@/lib/data/city', () => ({
  getCityBySlug: jest.fn(),
}));

// Mock getE2ECityDetail
jest.mock('@/data/e2e/discovery-fixtures', () => ({
  getE2ECityDetail: jest.fn().mockReturnValue(null),
}));

// Mock ApiResponseHandler
jest.mock('@/utils/api-response', () => ({
  ApiResponseHandler: {
    success: jest
      .fn()
      .mockImplementation(
        data => new Response(JSON.stringify({ success: true, data }), { status: 200 })
      ),
    error: jest
      .fn()
      .mockImplementation(
        (message, status, details) =>
          new Response(JSON.stringify({ success: false, error: message, details }), { status })
      ),
    notFound: jest.fn().mockImplementation(
      resource =>
        new Response(JSON.stringify({ success: false, error: `${resource} not found` }), {
          status: 404,
        })
    ),
  },
}));

const createRequest = (slug: string) => new NextRequest(`http://localhost/api/cities/${slug}`);

let GET: typeof import('../route').GET;

const sampleCity = {
  _id: 'city-bangkok',
  name: 'Bangkok',
  slug: 'bangkok',
  country: 'Thailand',
  sustainabilityScore: 75,
  highlights: ['Green rooftops'],
  description: 'A sustainable capital',
  primaryImage: {
    asset: {
      url: 'https://example.com/bangkok.jpg',
      metadata: { dimensions: { width: 1200, height: 800 } },
    },
  },
};

describe('Cities/[slug] API (MSW)', () => {
  beforeEach(async () => {
    jest.resetModules();
    process.env.SANITY_FETCH_MODE = 'msw';
    ({ GET } = await import('../route'));
  });

  afterEach(() => {
    delete process.env.SANITY_FETCH_MODE;
  });

  it('returns city data via Sanity MSW handler', async () => {
    const { getCityBySlug } = await import('@/lib/data/city');
    (getCityBySlug as jest.Mock).mockResolvedValue(sampleCity);

    const response = await GET(createRequest('bangkok'), {
      params: Promise.resolve({ slug: 'bangkok' }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.slug).toBe('bangkok');
    expect(json.data?.name).toBe('Bangkok');
  });

  it('handles Sanity errors gracefully', async () => {
    const { getCityBySlug } = await import('@/lib/data/city');
    (getCityBySlug as jest.Mock).mockRejectedValue(new Error('Sanity API error'));

    const response = await GET(createRequest('bangkok'), {
      params: Promise.resolve({ slug: 'bangkok' }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
  });

  it('handles network errors from Sanity', async () => {
    const { getCityBySlug } = await import('@/lib/data/city');
    (getCityBySlug as jest.Mock).mockRejectedValue(new Error('Network timeout'));

    const response = await GET(createRequest('bangkok'), {
      params: Promise.resolve({ slug: 'bangkok' }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
  });
});
