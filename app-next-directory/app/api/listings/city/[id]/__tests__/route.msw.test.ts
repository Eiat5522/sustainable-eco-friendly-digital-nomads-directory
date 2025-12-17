import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { HttpResponse, http } from 'msw';
import { NextRequest } from 'next/server';
import { server } from '@/mocks/server';

// Mock isSanityConfigured
jest.mock('@/lib/sanity/env', () => ({
  isSanityConfigured: jest.fn().mockReturnValue(true),
}));

// Mock getListingsByCityId
jest.mock('@/lib/data/city', () => ({
  getListingsByCityId: jest.fn(),
}));

// Mock getE2EListingsForCity
jest.mock('@/data/e2e/discovery-fixtures', () => ({
  getE2EListingsForCity: jest.fn().mockReturnValue([]),
}));

// Mock ApiResponseHandler
jest.mock('@/utils/api-response', () => ({
  ApiResponseHandler: {
    success: jest.fn().mockImplementation((data) => new Response(JSON.stringify({ success: true, data }), { status: 200 })),
    error: jest.fn().mockImplementation((message, status, details) => 
      new Response(JSON.stringify({ success: false, error: message, details }), { status })
    ),
    notFound: jest.fn().mockImplementation((resource) => 
      new Response(JSON.stringify({ success: false, error: `${resource} not found` }), { status: 404 })
    ),
  },
}));

type RouteContext = {
  params: Promise<{ id: string }>;
};

const createRequest = (id: string) => ({ params: Promise.resolve({ id }) }) as RouteContext;

const createNextRequest = () => new NextRequest('http://localhost/api/listings/city/city-bangkok');

let GET: typeof import('../route').GET;

const sampleListing = {
  _id: 'listing-green-cowork-bangkok',
  name: 'Green Cowork Bangkok',
  slug: 'green-cowork-bangkok',
  type: 'coworking',
  shortDescription: 'Sustainable coworking space',
  address: '123 Sustainable St',
  location: { lat: 13.75, lng: 100.5 },
  priceRange: 'moderate',
  website: 'https://greencowork.com',
  ecoFocusTags: [{ name: 'Solar Power' }],
  digitalNomadFeatures: [{ name: 'Fast WiFi' }],
  amenities: [{ name: 'Organic Coffee' }],
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
    const { getListingsByCityId } = await import('@/lib/data/city');
    (getListingsByCityId as jest.Mock).mockResolvedValue([sampleListing]);

    const response = await GET(createNextRequest(), createRequest('city-bangkok'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data?.listings)).toBe(true);
    expect(json.data.listings[0]).toMatchObject({
      _id: sampleListing._id,
      name: sampleListing.name,
    });
    expect(json.data.listings[0].city).toMatchObject({
      _id: sampleListing.city._id,
      name: sampleListing.city.name,
    });
  });

  it('handles Sanity failures gracefully', async () => {
    const { getListingsByCityId } = await import('@/lib/data/city');
    (getListingsByCityId as jest.Mock).mockRejectedValue(new Error('Sanity API error'));

    const response = await GET(createNextRequest(), createRequest('city-bangkok'));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
  });

  it('handles network errors from Sanity', async () => {
    const { getListingsByCityId } = await import('@/lib/data/city');
    (getListingsByCityId as jest.Mock).mockRejectedValue(new Error('Network timeout'));

    const response = await GET(createNextRequest(), createRequest('city-bangkok'));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
  });
});
