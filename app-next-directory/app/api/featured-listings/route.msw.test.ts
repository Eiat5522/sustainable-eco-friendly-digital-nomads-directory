import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { NextRequest } from 'next/server';

const createRequest = () => new NextRequest('http://localhost/api/featured-listings');

let GET: typeof import('../route').GET;

const sampleSanityListing = {
  _id: 'msw-listing-id',
  name: 'MSW Featured Venue',
  slug: 'msw-featured-venue',
  city: { _id: 'city-bangkok', name: 'Bangkok', slug: 'bangkok', country: 'Thailand' },
  ecoFocusTags: ['Solar Powered'],
  digitalNomadFeatures: ['24/7 Access'],
  amenities: [{ _id: 'amenity-1', name: 'Fast WiFi', description: 'Fiber', badge: { asset: { url: 'https://example.com/badge.png' } } }],
  primaryImage: { asset: { url: 'https://example.com/hero.jpg' } },
  galleryImages: [{ asset: { url: 'https://example.com/gallery.jpg' } }],
  location: { lat: 13.75, lng: 100.5 },
  priceRange: 'moderate',
  type: 'coworking',
  shortDescription: 'Mocked MSW listing',
  address: '123 Green Road',
  category: 'coworking',
  imageUrl: 'https://example.com/hero.jpg',
};

describe('Featured Listings API (MSW)', () => {
  beforeEach(async () => {
    jest.resetModules();
    process.env.SANITY_FETCH_MODE = 'msw';
    ({ GET } = await import('./route'));
  });

  afterEach(() => {
    delete process.env.SANITY_FETCH_MODE;
  });

  it('returns featured listings via MSW', async () => {
    server.use(
      http.get('https://:projectId.api.sanity.io/v:apiVersion/data/query/:dataset', () =>
        HttpResponse.json({
          ms: 2,
          query: 'mock',
          result: [sampleSanityListing],
        })
      )
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.listings).toHaveLength(1);
    expect(json.data.listings[0]).toMatchObject({
      id: sampleSanityListing._id,
      name: sampleSanityListing.name,
      slug: sampleSanityListing.slug,
      city: sampleSanityListing.city.name,
      imageUrl: sampleSanityListing.imageUrl,
      featured: true,
    });
  });

  it('handles Sanity fetch failures gracefully', async () => {
    server.use(
      http.get('https://:projectId.api.sanity.io/v:apiVersion/data/query/:dataset', () =>
        new Response(null, { status: 500 })
      )
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Failed to fetch listings');
  });

  it('handles network errors from Sanity', async () => {
    server.use(
      http.get('https://:projectId.api.sanity.io/v:apiVersion/data/query/:dataset', () =>
        HttpResponse.error('Network timeout')
      )
    );

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Failed to fetch listings');
  });
});
