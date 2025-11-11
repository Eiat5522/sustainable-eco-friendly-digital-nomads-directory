import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { NextRequest } from 'next/server';

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
    server.use(
      http.get('https://:projectId.api.sanity.io/v:apiVersion/data/query/:dataset', ({ request }) => {
        const url = new URL(request.url);
        const paramsText = url.searchParams.get('params');
        const params = paramsText ? JSON.parse(paramsText) : {};
        const slug = params.slug ?? params.slugName ?? sampleCity.slug;
        return HttpResponse.json({
          ms: 4,
          query: url.searchParams.get('query'),
          result: { ...sampleCity, slug },
        });
      })
    );

    const response = await GET(createRequest('bangkok'), { params: Promise.resolve({ slug: 'bangkok' }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.slug).toBe('bangkok');
    expect(json.data?.name).toBe('Bangkok');
  });

  it('handles Sanity errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.get('https://:projectId.api.sanity.io/v:apiVersion/data/query/:dataset', () =>
        new Response(null, { status: 500 })
      )
    );

    const response = await GET(createRequest('bangkok'), { params: Promise.resolve({ slug: 'bangkok' }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('handles network errors from Sanity', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.get('https://:projectId.api.sanity.io/v:apiVersion/data/query/:dataset', () =>
        HttpResponse.error('Network timeout')
      )
    );

    const response = await GET(createRequest('bangkok'), { params: Promise.resolve({ slug: 'bangkok' }) });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
