/**
 * Unit tests for listing-form-options.dal.ts
 * Tests the Data Access Layer for listing form options
 */

import { jest } from '@jest/globals';
import { getListingFormOptions } from '../listing-form-options.dal';

// Mock dependencies
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
  },
}));

jest.mock('@/lib/data-access/cities.dal', () => ({
  getCitiesList: jest.fn(),
}));

jest.mock('@/lib/data-access/home.dal', () => ({
  getEcoTags: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  structuredLogger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
}));

jest.mock('@/data/e2e/discovery-fixtures', () => ({
  e2eDiscoveryListings: [
    {
      ecoFocusTags: ['Solar Energy', 'Recycling'],
      digitalNomadFeatures: ['High-Speed WiFi', 'Coworking Space'],
    },
    {
      ecoFocusTags: ['Solar Energy', 'Water Conservation'],
      digitalNomadFeatures: ['High-Speed WiFi', 'Meeting Rooms'],
    },
  ],
  e2eFilterMetadata: {
    cities: [
      { _id: 'city-1', name: 'Bangkok' },
      { _id: 'city-2', name: 'Lisbon' },
    ],
    amenities: [{ name: 'WiFi' }, { name: 'Coffee' }],
  },
  isE2ERun: jest.fn(),
}));

// Import mocked modules
import { isE2ERun } from '@/data/e2e/discovery-fixtures';
import { getCitiesList } from '@/lib/data-access/cities.dal';
import { getEcoTags } from '@/lib/data-access/home.dal';
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';

const mockIsE2ERun = isE2ERun as jest.MockedFunction<typeof isE2ERun>;
const mockGetCitiesList = getCitiesList as jest.MockedFunction<typeof getCitiesList>;
const mockGetEcoTags = getEcoTags as jest.MockedFunction<typeof getEcoTags>;
const mockFetch = client.fetch as jest.MockedFunction<typeof client.fetch>;

describe('listing-form-options.dal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsE2ERun.mockReturnValue(false);
  });

  describe('getListingFormOptions', () => {
    it('should fetch and return form options successfully', async () => {
      const mockCities = [
        { _id: 'city-1', name: 'Bangkok', slug: 'bangkok', country: 'Thailand' },
        { _id: 'city-2', name: 'Lisbon', slug: 'lisbon', country: 'Portugal' },
      ];
      const mockEcoTags = [
        { _id: 'eco-1', name: 'Solar Energy' },
        { _id: 'eco-2', name: 'Recycling' },
      ];
      const mockFeatures = [
        { _id: 'feature-1', name: 'High-Speed WiFi' },
        { _id: 'feature-2', name: 'Coworking Space' },
      ];
      const mockAmenities = [
        { _id: 'amenity-1', name: 'WiFi' },
        { _id: 'amenity-2', name: 'Coffee' },
      ];

      mockGetCitiesList.mockResolvedValue(mockCities);
      mockGetEcoTags.mockResolvedValue(mockEcoTags);
      mockFetch
        .mockResolvedValueOnce(mockFeatures) // digitalNomadFeatures
        .mockResolvedValueOnce(mockAmenities); // amenities

      const result = await getListingFormOptions();

      expect(result).toEqual({
        cities: [
          { _id: 'city-1', name: 'Bangkok' },
          { _id: 'city-2', name: 'Lisbon' },
        ],
        ecoTags: [
          { _id: 'eco-1', name: 'Solar Energy' },
          { _id: 'eco-2', name: 'Recycling' },
        ],
        digitalNomadFeatures: mockFeatures,
        amenities: mockAmenities,
      });

      expect(mockGetCitiesList).toHaveBeenCalledWith(80);
      expect(mockGetEcoTags).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return E2E form options when in E2E mode', async () => {
      mockIsE2ERun.mockReturnValue(true);

      const result = await getListingFormOptions();

      expect(result).toHaveProperty('cities');
      expect(result).toHaveProperty('ecoTags');
      expect(result).toHaveProperty('digitalNomadFeatures');
      expect(result).toHaveProperty('amenities');

      expect(result.cities).toEqual([
        { _id: 'city-1', name: 'Bangkok' },
        { _id: 'city-2', name: 'Lisbon' },
      ]);

      expect(result.ecoTags).toContainEqual({ _id: 'Solar Energy', name: 'Solar Energy' });
      expect(result.ecoTags).toContainEqual({ _id: 'Recycling', name: 'Recycling' });

      expect(mockGetCitiesList).not.toHaveBeenCalled();
      expect(mockGetEcoTags).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle empty arrays from Sanity', async () => {
      mockGetCitiesList.mockResolvedValue([]);
      mockGetEcoTags.mockResolvedValue([]);
      mockFetch.mockResolvedValue([]);

      const result = await getListingFormOptions();

      expect(result).toEqual({
        cities: [],
        ecoTags: [],
        digitalNomadFeatures: [],
        amenities: [],
      });
    });

    it('should handle invalid data format from Sanity', async () => {
      mockGetCitiesList.mockResolvedValue([{ _id: 'city-1', name: 'Bangkok' }] as any);
      mockGetEcoTags.mockResolvedValue([{ _id: 'eco-1', name: 'Solar' }] as any);
      mockFetch
        .mockResolvedValueOnce([{ _id: 'feature-1', name: 'WiFi' }])
        .mockResolvedValueOnce([{ _id: 'amenity-1', name: 'Coffee' }]);

      const result = await getListingFormOptions();

      expect(result.cities).toHaveLength(1);
      expect(result.ecoTags).toHaveLength(1);
      expect(result.digitalNomadFeatures).toHaveLength(1);
      expect(result.amenities).toHaveLength(1);
    });

    it('should filter out invalid entries from arrays', async () => {
      mockGetCitiesList.mockResolvedValue([
        { _id: 'city-1', name: 'Bangkok' },
        { id: 'city-2', name: 'Lisbon' }, // Has 'id' instead of '_id'
        { _id: 'city-3' }, // Missing name
        null, // null entry
      ] as any);

      mockGetEcoTags.mockResolvedValue([
        { _id: 'eco-1', name: 'Solar' },
        { _id: 123, name: 'Wind' }, // Invalid _id type
      ] as any);

      mockFetch
        .mockResolvedValueOnce([
          { _id: 'feature-1', name: 'WiFi' },
          { name: 'NoID' }, // Missing _id
        ])
        .mockResolvedValueOnce([{ _id: 'amenity-1', name: 'Coffee' }]);

      const result = await getListingFormOptions();

      expect(result.cities).toEqual([
        { _id: 'city-1', name: 'Bangkok' },
        { _id: 'city-2', name: 'Lisbon' },
      ]);
      expect(result.ecoTags).toEqual([{ _id: 'eco-1', name: 'Solar' }]);
    });

    it('should handle fetch errors gracefully', async () => {
      mockGetCitiesList.mockResolvedValue([]);
      mockGetEcoTags.mockResolvedValue([]);
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await getListingFormOptions();

      expect(result).toEqual({
        cities: [],
        ecoTags: [],
        digitalNomadFeatures: [],
        amenities: [],
      });

      expect(structuredLogger.error).toHaveBeenCalledTimes(2);
    });

    it('should handle non-array responses from Sanity', async () => {
      mockGetCitiesList.mockResolvedValue(null as any);
      mockGetEcoTags.mockResolvedValue(undefined as any);
      mockFetch.mockResolvedValue(null);

      const result = await getListingFormOptions();

      expect(result.cities).toEqual([]);
      expect(result.ecoTags).toEqual([]);
    });

    it('should handle entries with both _id and id fields', async () => {
      mockGetCitiesList.mockResolvedValue([
        { _id: 'city-1', id: 'alt-id', name: 'Bangkok' },
      ] as any);

      mockGetEcoTags.mockResolvedValue([]);
      mockFetch.mockResolvedValue([]);

      const result = await getListingFormOptions();

      // Should prefer _id over id
      expect(result.cities).toEqual([{ _id: 'city-1', name: 'Bangkok' }]);
    });

    it('should deduplicate E2E eco tags', async () => {
      mockIsE2ERun.mockReturnValue(true);

      const result = await getListingFormOptions();

      const ecoTagNames = result.ecoTags.map(tag => tag.name);
      const uniqueNames = new Set(ecoTagNames);

      expect(ecoTagNames.length).toBe(uniqueNames.size);
    });

    it('should trim and filter empty E2E tags', async () => {
      mockIsE2ERun.mockReturnValue(true);

      const result = await getListingFormOptions();

      result.ecoTags.forEach(tag => {
        expect(tag.name).toBeTruthy();
        expect(tag.name.trim()).toBe(tag.name);
      });

      result.digitalNomadFeatures.forEach(feature => {
        expect(feature.name).toBeTruthy();
        expect(feature.name.trim()).toBe(feature.name);
      });
    });
  });
});
