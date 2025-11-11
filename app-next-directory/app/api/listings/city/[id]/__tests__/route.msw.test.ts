import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { NextRequest } from 'next/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const createRequest = (id: string) =>
  ({ params: Promise.resolve({ id }) } as RouteContext);

const createNextRequest = () => new NextRequest('http://localhost/api/listings/city/city-bangkok');

let GET: typeof import('../route').GET;

const sampleListing = {
  _id: 'listing-1',
  name: 'MSW Coworking',
  slug: 'msw-coworking',
  type: 'coworking',
  shortDescription: 'Test listing',
  address: '123 Test St',
  location: { lat: 13.75, lng: 100.5 },
  priceRange: 'moderate',
  website: 'https://example.com',
  ecoFocusTags: [{ name: 'Solar' }],
  digitalNomadFeatures: [{ name: 'Fast WiFi' }],
  amenities: [{ name: 'Coffee' }],
  city: {
    _id: 'city-bangkok',
    name: 'Bangkok',
    country: 'Thailand',
    slug: 'bangkok',
  },
};

describe('Listings/city/[id] API (MSW)', () => {
  beforeEach(async () => {
    jest.resetModules();
    process.env.SANITY_FETCH_MODE = 'msw';
    ({ GET } = await import('../route'));
  });

  afterEach(() => {
    delete process.env.SANITY_FETCH_MODE;
  });

  it('returns listings via Sanity MSW handler', async () => {
    server.use(
      http.get('https://:projectId.api.sanity.io/v:apiVersion/data/query/:dataset', () =>
        HttpResponse.json({
          ms: 4,
          query: 'mock',
          result: [sampleListing],
        })
      )
    );

    const response = await GET(createNextRequest(), createRequest('city-bangkok'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data?.listings)).toBe(true);
    expect(json.data.listings[0]).toMatchObject({
      id: sampleListing._id,
      name: sampleListing.name,
    });
    expect(json.data.listings[0].city).toMatchObject({
      id: sampleListing.city._id,
      name: sampleListing.city.name,
    });
  });

  it('handles Sanity failures gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.get('https://:projectId.api.sanity.io/v:apiVersion/data/query/:dataset', () =>
        new Response(null, { status: 500 })
      )
    );

    const response = await GET(createNextRequest(), createRequest('city-bangkok'));
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

    const response = await GET(createNextRequest(), createRequest('city-bangkok'));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
