/**
 * Unit tests for cities.dal.tsx
 * Tests the Data Access Layer for city data
 */

import { jest } from '@jest/globals';
import type { CityDetailDTO, CityDTO } from '@/types/dto';
import {
  getAllCitySlugs,
  getCitiesList,
  getCityBySlug,
  getCityDetailBySlug,
  getListingsByCityId,
} from '../cities.dal';

// Mock dependencies
jest.mock('@/lib/sanity/client', () => ({
  sanityFetch: jest.fn(),
}));

jest.mock('@/lib/dto-transformer', () => ({
  transformToSummaryDTO: jest.fn(listing => ({
    id: listing._id,
    name: listing.name,
    slug: listing.slug.current,
    type: listing.type,
  })),
}));

jest.mock('@/data/e2e/discovery-fixtures', () => ({
  isE2ERun: jest.fn().mockReturnValue(false),
  getE2ECitySummary: jest.fn(),
  getE2ECityDetail: jest.fn(),
  getE2ECityList: jest.fn(),
  getE2EListingsForCity: jest.fn(),
}));

// Import mocked modules
import {
  getE2ECityDetail,
  getE2ECityList,
  getE2ECitySummary,
  getE2EListingsForCity,
  isE2ERun,
} from '@/data/e2e/discovery-fixtures';
import { sanityFetch } from '@/lib/sanity/client';

const mockSanityFetch = sanityFetch as jest.MockedFunction<typeof sanityFetch>;
const mockIsE2ERun = isE2ERun as jest.MockedFunction<typeof isE2ERun>;
const mockGetE2ECitySummary = getE2ECitySummary as jest.MockedFunction<typeof getE2ECitySummary>;
const mockGetE2ECityDetail = getE2ECityDetail as jest.MockedFunction<typeof getE2ECityDetail>;
const mockGetE2ECityList = getE2ECityList as jest.MockedFunction<typeof getE2ECityList>;
const mockGetE2EListingsForCity = getE2EListingsForCity as jest.MockedFunction<
  typeof getE2EListingsForCity
>;

describe('cities.dal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsE2ERun.mockReturnValue(false);
  });

  describe('getCityBySlug', () => {
    it('should fetch and map city data successfully', async () => {
      const mockSanityCity = {
        _id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
        country: 'Thailand',
        sustainabilityScore: 75,
        highlights: ['Green spaces', 'Public transport'],
        description: 'A vibrant city',
        primaryImage: {
          asset: {
            url: 'https://example.com/image.jpg',
            metadata: { dimensions: { width: 800, height: 600 } },
          },
        },
      };

      mockSanityFetch.mockResolvedValue(mockSanityCity);

      const result = await getCityBySlug('bangkok');

      expect(result).toEqual({
        id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
        country: 'Thailand',
        sustainabilityScore: 75,
        highlights: ['Green spaces', 'Public transport'],
        description: 'A vibrant city',
        imageUrl: 'https://example.com/image.jpg',
        imageDimensions: { width: 800, height: 600 },
      });
    });

    it('should return null when city not found', async () => {
      mockSanityFetch.mockResolvedValue(null);

      const result = await getCityBySlug('non-existent');

      expect(result).toBeNull();
    });

    it('should return null for invalid city data', async () => {
      mockSanityFetch.mockResolvedValue({ name: 'Bangkok' }); // Missing _id and slug

      const result = await getCityBySlug('bangkok');

      expect(result).toBeNull();
    });

    it('should handle missing optional fields', async () => {
      mockSanityFetch.mockResolvedValue({
        _id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
      });

      const result = await getCityBySlug('bangkok');

      expect(result).toEqual({
        id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
        country: '',
        sustainabilityScore: undefined,
        highlights: [],
        description: undefined,
        imageUrl: undefined,
        imageDimensions: undefined,
      });
    });

    it('should clamp sustainability score to 0-100 range', async () => {
      mockSanityFetch.mockResolvedValueOnce({
        _id: 'city-1',
        name: 'City A',
        slug: 'city-a',
        sustainabilityScore: 150,
      });

      const result1 = await getCityBySlug('city-a');
      expect(result1?.sustainabilityScore).toBe(100);

      mockSanityFetch.mockResolvedValueOnce({
        _id: 'city-2',
        name: 'City B',
        slug: 'city-b',
        sustainabilityScore: -10,
      });

      const result2 = await getCityBySlug('city-b');
      expect(result2?.sustainabilityScore).toBe(0);
    });

    it('should filter non-string highlights', async () => {
      mockSanityFetch.mockResolvedValue({
        _id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
        highlights: ['Valid', 123, null, 'Also Valid', undefined],
      });

      const result = await getCityBySlug('bangkok');

      expect(result?.highlights).toEqual(['Valid', 'Also Valid']);
    });

    it('should use E2E data when in E2E mode', async () => {
      mockIsE2ERun.mockReturnValue(true);
      const mockE2ECity: CityDTO = {
        id: 'city-1',
        name: 'E2E City',
        slug: 'e2e-city',
        country: 'E2E Country',
        highlights: [],
      };
      mockGetE2ECitySummary.mockReturnValue(mockE2ECity);

      const result = await getCityBySlug('e2e-city');

      expect(result).toEqual(mockE2ECity);
      expect(mockSanityFetch).not.toHaveBeenCalled();
    });

    it('should handle missing image dimensions', async () => {
      mockSanityFetch.mockResolvedValue({
        _id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
        primaryImage: {
          asset: {
            url: 'https://example.com/image.jpg',
          },
        },
      });

      const result = await getCityBySlug('bangkok');

      expect(result?.imageUrl).toBe('https://example.com/image.jpg');
      expect(result?.imageDimensions).toBeUndefined();
    });

    it('should handle invalid dimension values', async () => {
      mockSanityFetch.mockResolvedValue({
        _id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
        primaryImage: {
          asset: {
            url: 'https://example.com/image.jpg',
            metadata: {
              dimensions: { width: NaN, height: Infinity },
            },
          },
        },
      });

      const result = await getCityBySlug('bangkok');

      expect(result?.imageDimensions).toBeUndefined();
    });
  });

  describe('getCityDetailBySlug', () => {
    it('should fetch and map detailed city data', async () => {
      const mockSanityCity = {
        _id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
        country: 'Thailand',
        sustainabilityScore: 75,
        highlights: ['Green'],
        description: 'City description',
        shortDescription: 'Short desc',
        airQuality: 'Moderate',
        internetSpeed: 100,
        costOfLiving: 'Low',
        climate: 'Tropical',
        safety: 'Good',
        walkability: 'Excellent',
        sustainabilityInitiatives: ['Solar panels', { name: 'Recycling program' }],
        digitalNomadFeatures: [{ name: 'Coworking spaces' }, 'Fast WiFi'],
        galleryImages: [
          { asset: { url: 'https://example.com/gallery1.jpg' } },
          { asset: { url: 'https://example.com/gallery2.jpg' } },
        ],
        primaryImage: {
          asset: {
            url: 'https://example.com/primary.jpg',
            metadata: { dimensions: { width: 1200, height: 800 } },
          },
        },
      };

      mockSanityFetch.mockResolvedValue(mockSanityCity);

      const result = await getCityDetailBySlug('bangkok');

      expect(result).toEqual({
        id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
        country: 'Thailand',
        sustainabilityScore: 75,
        highlights: ['Green'],
        description: 'City description',
        imageUrl: 'https://example.com/primary.jpg',
        imageDimensions: { width: 1200, height: 800 },
        shortDescription: 'Short desc',
        airQuality: 'Moderate',
        internetSpeed: 100,
        costOfLiving: 'Low',
        climate: 'Tropical',
        safety: 'Good',
        walkability: 'Excellent',
        sustainabilityInitiatives: ['Solar panels', 'Recycling program'],
        digitalNomadFeatures: ['Coworking spaces', 'Fast WiFi'],
        galleryImages: ['https://example.com/gallery1.jpg', 'https://example.com/gallery2.jpg'],
      });
    });

    it('should return null when city not found', async () => {
      mockSanityFetch.mockResolvedValue(null);

      const result = await getCityDetailBySlug('non-existent');

      expect(result).toBeNull();
    });

    it('should handle missing optional detail fields', async () => {
      mockSanityFetch.mockResolvedValue({
        _id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
      });

      const result = await getCityDetailBySlug('bangkok');

      expect(result).toEqual({
        id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
        country: '',
        sustainabilityScore: undefined,
        highlights: [],
        description: undefined,
        imageUrl: undefined,
        imageDimensions: undefined,
        shortDescription: undefined,
        airQuality: undefined,
        internetSpeed: undefined,
        costOfLiving: undefined,
        climate: undefined,
        safety: undefined,
        walkability: undefined,
        sustainabilityInitiatives: [],
        digitalNomadFeatures: [],
        galleryImages: [],
      });
    });

    it('should normalize named values in arrays', async () => {
      mockSanityFetch.mockResolvedValue({
        _id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
        sustainabilityInitiatives: [
          'Plain string',
          { name: 'Named object' },
          { name: null },
          { name: '  ' },
          null,
        ],
      });

      const result = await getCityDetailBySlug('bangkok');

      expect(result?.sustainabilityInitiatives).toEqual(['Plain string', 'Named object']);
    });

    it('should filter invalid gallery image URLs', async () => {
      mockSanityFetch.mockResolvedValue({
        _id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
        galleryImages: [
          { asset: { url: 'https://example.com/valid.jpg' } },
          { asset: {} },
          null,
          { asset: { url: '   ' } },
        ],
      });

      const result = await getCityDetailBySlug('bangkok');

      expect(result?.galleryImages).toEqual(['https://example.com/valid.jpg']);
    });

    it('should use E2E data when in E2E mode', async () => {
      mockIsE2ERun.mockReturnValue(true);
      const mockE2ECity: CityDetailDTO = {
        id: 'city-1',
        name: 'E2E City',
        slug: 'e2e-city',
        country: 'E2E Country',
        highlights: [],
        sustainabilityInitiatives: [],
        digitalNomadFeatures: [],
        galleryImages: [],
      };
      mockGetE2ECityDetail.mockReturnValue(mockE2ECity);

      const result = await getCityDetailBySlug('e2e-city');

      expect(result).toEqual(mockE2ECity);
      expect(mockSanityFetch).not.toHaveBeenCalled();
    });
  });

  describe('getListingsByCityId', () => {
    it('should fetch and transform listings for a city', async () => {
      const mockListings = [
        {
          _id: 'listing-1',
          name: 'Coworking Space',
          slug: 'coworking-space',
          type: 'coworking',
          city: { slug: 'bangkok' },
        },
        {
          _id: 'listing-2',
          name: 'Cafe',
          slug: 'cafe',
          type: 'cafe',
          city: { slug: 'bangkok' },
        },
      ];

      mockSanityFetch.mockResolvedValue(mockListings);

      const result = await getListingsByCityId('city-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'listing-1',
        name: 'Coworking Space',
        type: 'coworking',
      });
    });

    it('should return empty array when no listings found', async () => {
      mockSanityFetch.mockResolvedValue([]);

      const result = await getListingsByCityId('city-1');

      expect(result).toEqual([]);
    });

    it('should use E2E data when in E2E mode', async () => {
      mockIsE2ERun.mockReturnValue(true);
      const mockE2EListings = [
        { id: 'listing-1', name: 'E2E Listing', slug: 'e2e-listing', type: 'coworking' as const },
      ];
      mockGetE2EListingsForCity.mockReturnValue(mockE2EListings);

      const result = await getListingsByCityId('city-1');

      expect(result).toEqual(mockE2EListings);
      expect(mockSanityFetch).not.toHaveBeenCalled();
    });
  });

  describe('getAllCitySlugs', () => {
    it('should fetch all city slugs', async () => {
      mockSanityFetch.mockResolvedValue(['bangkok', 'lisbon', 'chiang-mai']);

      const result = await getAllCitySlugs();

      expect(result).toEqual(['bangkok', 'lisbon', 'chiang-mai']);
    });

    it('should return empty array when no cities exist', async () => {
      mockSanityFetch.mockResolvedValue([]);

      const result = await getAllCitySlugs();

      expect(result).toEqual([]);
    });

    it('should filter out invalid slug values', async () => {
      mockSanityFetch.mockResolvedValue(['bangkok', '', null, 'lisbon', undefined, 123]);

      const result = await getAllCitySlugs();

      expect(result).toEqual(['bangkok', 'lisbon']);
    });

    it('should return empty array on fetch error', async () => {
      mockSanityFetch.mockRejectedValue(new Error('Network error'));

      const result = await getAllCitySlugs();

      expect(result).toEqual([]);
    });

    it('should use E2E data when in E2E mode', async () => {
      mockIsE2ERun.mockReturnValue(true);
      const mockE2ECities = [
        { id: 'city-1', name: 'City 1', slug: 'city-1', country: 'Country', highlights: [] },
        { id: 'city-2', name: 'City 2', slug: 'city-2', country: 'Country', highlights: [] },
      ];
      mockGetE2ECityList.mockReturnValue(mockE2ECities);

      const result = await getAllCitySlugs();

      expect(result).toEqual(['city-1', 'city-2']);
      expect(mockSanityFetch).not.toHaveBeenCalled();
    });

    it('should handle non-array response', async () => {
      mockSanityFetch.mockResolvedValue(null);

      const result = await getAllCitySlugs();

      expect(result).toEqual([]);
    });
  });

  describe('getCitiesList', () => {
    it('should fetch paginated cities list', async () => {
      const mockCities = [
        {
          _id: 'city-1',
          name: 'Bangkok',
          slug: 'bangkok',
          country: 'Thailand',
          sustainabilityScore: 75,
          highlights: ['Green'],
        },
        {
          _id: 'city-2',
          name: 'Lisbon',
          slug: 'lisbon',
          country: 'Portugal',
          sustainabilityScore: 80,
          highlights: ['Bike lanes'],
        },
      ];

      mockSanityFetch.mockResolvedValue(mockCities);

      const result = await getCitiesList(20);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'city-1',
        name: 'Bangkok',
        slug: 'bangkok',
      });
    });

    it('should use default limit of 20', async () => {
      mockSanityFetch.mockResolvedValue([]);

      await getCitiesList();

      expect(mockSanityFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { limit: 20 },
        })
      );
    });

    it('should respect custom limit', async () => {
      mockSanityFetch.mockResolvedValue([]);

      await getCitiesList(50);

      expect(mockSanityFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { limit: 50 },
        })
      );
    });

    it('should filter out invalid city entries', async () => {
      mockSanityFetch.mockResolvedValue([
        { _id: 'city-1', name: 'Bangkok', slug: 'bangkok' },
        { name: 'Invalid' }, // Missing _id and slug
        null,
        { _id: 'city-2', name: 'Lisbon', slug: 'lisbon' },
      ]);

      const result = await getCitiesList();

      expect(result).toHaveLength(2);
    });

    it('should return empty array for non-array response', async () => {
      mockSanityFetch.mockResolvedValue(null);

      const result = await getCitiesList();

      expect(result).toEqual([]);
    });

    it('should use E2E data when in E2E mode', async () => {
      mockIsE2ERun.mockReturnValue(true);
      const mockE2ECities = [
        { id: 'city-1', name: 'E2E City', slug: 'e2e-city', country: 'Country', highlights: [] },
      ];
      mockGetE2ECityList.mockReturnValue(mockE2ECities);

      const result = await getCitiesList(10);

      expect(result).toEqual(mockE2ECities);
      expect(mockSanityFetch).not.toHaveBeenCalled();
      expect(mockGetE2ECityList).toHaveBeenCalledWith(10);
    });
  });
});
