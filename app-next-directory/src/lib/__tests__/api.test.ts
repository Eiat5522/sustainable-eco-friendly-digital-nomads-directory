import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { HttpResponse, http } from 'msw';
import { server } from '@/mocks/server';
import { fetchCityDetails, fetchCityListings } from '../api';

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

describe('API Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchCityDetails', () => {
    it('should fetch city details successfully', async () => {
      const mockCityData = {
        id: '1',
        name: 'Bangkok',
        slug: 'bangkok',
        description: 'Capital of Thailand',
        coordinates: { lat: 13.7563, lng: 100.5018 },
      };

      server.use(
        http.get('*/api/cities/:slug', ({ params }) => {
          const { slug } = params as any;
          if (slug !== 'bangkok') return new Response(null, { status: 404 });
          return jsonResponse({ success: true, data: { city: mockCityData } }, { status: 200 });
        })
      );

      const result = await fetchCityDetails('bangkok');
      expect(result).toEqual(mockCityData);
    });

    it('should handle fetch error when response is not ok', async () => {
      server.use(http.get('*/api/cities/:slug', () => new Response(null, { status: 500 })));
      await expect(fetchCityDetails('bangkok')).rejects.toThrow('Request failed with status 500');
    });

    it('should handle network error', async () => {
      server.use(http.get('*/api/cities/:slug', () => HttpResponse.error()));
      await expect(fetchCityDetails('bangkok')).rejects.toBeInstanceOf(Error);
    });

    it('should handle JSON parsing error', async () => {
      server.use(
        http.get(
          '*/api/cities/:slug',
          () =>
            new Response('not-json', {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
        )
      );
      await expect(fetchCityDetails('bangkok')).rejects.toBeInstanceOf(Error);
    });
  });

  describe('fetchCityListings', () => {
    it('should fetch city listings successfully', async () => {
      const mockListingsData = [
        {
          id: '1',
          title: 'Green Cafe',
          slug: 'green-cafe',
          type: 'cafe',
          city: 'Bangkok',
        },
        {
          id: '2',
          title: 'Eco Coworking',
          slug: 'eco-coworking',
          type: 'coworking',
          city: 'Bangkok',
        },
      ];

      server.use(
        http.get('*/api/listings', ({ request }) => {
          const url = new URL(request.url);
          const slug = url.searchParams.get('citySlug');
          if (slug !== 'bangkok') return new Response(null, { status: 404 });
          return jsonResponse(
            { success: true, data: { listings: mockListingsData, total: 2 } },
            { status: 200 }
          );
        })
      );

      const result = await fetchCityListings('bangkok');
      expect(result).toEqual(mockListingsData);
    });

    it('should handle missing listings data', async () => {
      server.use(
        http.get('*/api/listings', () => jsonResponse({ success: true, data: {} }, { status: 200 }))
      );
      const result = await fetchCityListings('bangkok');
      expect(result).toEqual([]);
    });

    it('should return empty array when response is not ok', async () => {
      server.use(http.get('*/api/listings', () => new Response(null, { status: 500 })));
      const result = await fetchCityListings('bangkok');
      expect(result).toEqual([]);
    });

    it('should return empty array on network error', async () => {
      server.use(http.get('*/api/listings', () => HttpResponse.error()));
      const result = await fetchCityListings('bangkok');
      expect(result).toEqual([]);
    });

    it('should handle JSON parsing error gracefully', async () => {
      server.use(
        http.get(
          '*/api/listings',
          () =>
            new Response('not-json', {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
        )
      );
      const result = await fetchCityListings('bangkok');
      expect(result).toEqual([]);
    });

    it('should call endpoint with slug as-is', async () => {
      let capturedUrl = '';
      server.use(
        http.get('*/api/listings', ({ request }) => {
          capturedUrl = request.url;
          return jsonResponse({ success: true, data: { listings: [] } }, { status: 200 });
        })
      );
      await fetchCityListings('chiang-mai');
      expect(capturedUrl).toContain('/api/listings?citySlug=chiang-mai');
    });
  });
});
