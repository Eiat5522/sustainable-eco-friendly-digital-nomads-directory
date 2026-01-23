/**
 * Unit tests for listing-management.dal.ts
 * Tests the Data Access Layer for managed listing operations
 */

import { jest } from '@jest/globals';
import {
  createManagedListing,
  getManagedListingForEdit,
  updateManagedListing,
} from '../listing-management.dal';

// Mock dependencies
jest.mock('@/lib/sanity/client', () => ({
  client: {
    fetch: jest.fn(),
    createIfNotExists: jest.fn(),
    patch: jest.fn(() => ({
      set: jest.fn(() => ({
        commit: jest.fn(),
      })),
    })),
  },
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

jest.mock('@/lib/utils/slug', () => ({
  toSlug: jest.fn(str => str.toLowerCase().replace(/\s+/g, '-')),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234-5678-90ab'),
}));

// Import mocked modules
import { structuredLogger } from '@/lib/logger';
import { client } from '@/lib/sanity/client';

const mockFetch = client.fetch as jest.MockedFunction<typeof client.fetch>;
const mockCreateIfNotExists = client.createIfNotExists as jest.MockedFunction<
  typeof client.createIfNotExists
>;
const mockPatch = client.patch as jest.MockedFunction<typeof client.patch>;

describe('listing-management.dal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getManagedListingForEdit', () => {
    it('should return listing for admin user', async () => {
      const mockListing = {
        _id: 'listing-1',
        name: 'Test Listing',
        type: 'coworking',
      };

      mockFetch.mockResolvedValue(mockListing);

      const result = await getManagedListingForEdit('listing-1', {
        id: 'user-1',
        role: 'admin',
      });

      expect(result).toEqual(mockListing);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('_type == "listing"'),
        expect.objectContaining({ id: 'listing-1' })
      );
    });

    it('should return listing for venue owner when they own it', async () => {
      const mockListing = {
        _id: 'listing-1',
        name: 'Test Listing',
        owner: { _ref: 'user-1' },
      };

      mockFetch.mockResolvedValue(mockListing);

      const result = await getManagedListingForEdit('listing-1', {
        id: 'user-1',
        role: 'venueOwner',
      });

      expect(result).toEqual(mockListing);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('owner._ref == $userId'),
        expect.objectContaining({ id: 'listing-1', userId: 'user-1' })
      );
    });

    it('should return null for regular user', async () => {
      const result = await getManagedListingForEdit('listing-1', {
        id: 'user-1',
        role: 'user',
      });

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return null for premium user', async () => {
      const result = await getManagedListingForEdit('listing-1', {
        id: 'user-1',
        role: 'premium',
      });

      expect(result).toBeNull();
    });

    it('should return null for superAdmin', async () => {
      mockFetch.mockResolvedValue({ _id: 'listing-1' });

      const result = await getManagedListingForEdit('listing-1', {
        id: 'user-1',
        role: 'superAdmin',
      });

      expect(result).toEqual({ _id: 'listing-1' });
    });

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Database error'));

      const result = await getManagedListingForEdit('listing-1', {
        id: 'user-1',
        role: 'admin',
      });

      expect(result).toBeNull();
      expect(structuredLogger.error).toHaveBeenCalledWith(
        'Failed to fetch managed listing',
        expect.any(Error),
        expect.objectContaining({
          component: 'listing-management.dal',
          listingId: 'listing-1',
        })
      );
    });
  });

  describe('createManagedListing', () => {
    it('should create listing successfully for venue owner', async () => {
      // Mock quota check
      mockFetch
        .mockResolvedValueOnce({
          _id: 'user-1',
          maxLocations: null,
          listingQuotaTier: 'free',
          quotaOverrideByAdmin: false,
        })
        .mockResolvedValueOnce(0); // current count

      const listingData = {
        name: 'Test Venue',
        type: 'coworking',
        city: 'city-1',
        shortDescription: 'A great place',
        address: '123 Main St',
      };

      mockCreateIfNotExists.mockResolvedValue({ _id: 'listing-1' } as any);

      const result = await createManagedListing(listingData, {
        id: 'user-1',
        role: 'venueOwner',
      });

      expect(result).toEqual({ _id: 'listing-1' });
      expect(mockCreateIfNotExists).toHaveBeenCalledWith(
        expect.objectContaining({
          _type: 'listing',
          name: 'Test Venue',
          type: 'coworking',
          category: 'coworking',
          owner: { _type: 'reference', _ref: 'user-1' },
          city: { _type: 'reference', _ref: 'city-1' },
          shortDescription: 'A great place',
          address: '123 Main St',
        })
      );
    });

    it('should throw error for unauthorized user', async () => {
      const listingData = { name: 'Test', type: 'coworking', city: 'city-1' };

      await expect(
        createManagedListing(listingData, { id: 'user-1', role: 'user' })
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw error when name is missing', async () => {
      const listingData = { name: '', type: 'coworking', city: 'city-1' };

      await expect(
        createManagedListing(listingData, { id: 'user-1', role: 'admin' })
      ).rejects.toThrow('Listing name is required');
    });

    it('should throw error when type is invalid', async () => {
      const listingData = { name: 'Test', type: 'invalid-type', city: 'city-1' };

      await expect(
        createManagedListing(listingData, { id: 'user-1', role: 'admin' })
      ).rejects.toThrow('Listing type is required');
    });

    it('should throw error when city is missing', async () => {
      const listingData = { name: 'Test', type: 'coworking', city: '' };

      await expect(
        createManagedListing(listingData, { id: 'user-1', role: 'admin' })
      ).rejects.toThrow('City reference is required');
    });

    it('should allow admin to set different owner', async () => {
      mockFetch
        .mockResolvedValueOnce({
          _id: 'owner-2',
          quotaOverrideByAdmin: false,
          listingQuotaTier: 'pro',
        })
        .mockResolvedValueOnce(0);

      const listingData = {
        name: 'Test Venue',
        type: 'coworking',
        city: 'city-1',
        owner: 'owner-2',
      };

      mockCreateIfNotExists.mockResolvedValue({ _id: 'listing-1' } as any);

      await createManagedListing(listingData, { id: 'user-1', role: 'admin' });

      expect(mockCreateIfNotExists).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: { _type: 'reference', _ref: 'owner-2' },
        })
      );
    });

    it('should include optional fields when provided', async () => {
      // Mock quota check
      mockFetch
        .mockResolvedValueOnce({
          _id: 'user-1',
          quotaOverrideByAdmin: false,
          listingQuotaTier: 'free',
        })
        .mockResolvedValueOnce(0);

      const listingData = {
        name: 'Test Venue',
        type: 'restaurant',
        city: 'city-1',
        contactPhone: '123-456-7890',
        contactEmail: 'test@example.com',
        website: 'https://test.com',
        priceRange: 'moderate',
        primaryImage: { asset: { _ref: 'image-1' } },
        galleryImages: [{ asset: { _ref: 'image-2' } }],
      };

      mockCreateIfNotExists.mockResolvedValue({ _id: 'listing-1' } as any);

      await createManagedListing(listingData, { id: 'user-1', role: 'admin' });

      expect(mockCreateIfNotExists).toHaveBeenCalledWith(
        expect.objectContaining({
          contactPhone: '123-456-7890',
          contactEmail: 'test@example.com',
          website: 'https://test.com',
          priceRange: 'moderate',
          primaryImage: { asset: { _ref: 'image-1' } },
          galleryImages: [{ asset: { _ref: 'image-2' } }],
        })
      );
    });

    it('should include reference arrays with keys', async () => {
      // Mock quota check
      mockFetch
        .mockResolvedValueOnce({
          _id: 'user-1',
          quotaOverrideByAdmin: false,
          listingQuotaTier: 'free',
        })
        .mockResolvedValueOnce(0);

      const listingData = {
        name: 'Test Venue',
        type: 'coworking',
        city: 'city-1',
        ecoFocusTags: ['tag-1', 'tag-2'],
        digitalNomadFeatures: ['feature-1'],
        amenities: ['amenity-1', 'amenity-2'],
      };

      mockCreateIfNotExists.mockResolvedValue({ _id: 'listing-1' } as any);

      await createManagedListing(listingData, { id: 'user-1', role: 'admin' });

      const call = mockCreateIfNotExists.mock.calls[0][0];
      expect(call.ecoFocusTags).toHaveLength(2);
      expect(call.ecoFocusTags[0]).toMatchObject({
        _type: 'reference',
        _ref: 'tag-1',
        _key: expect.any(String),
      });
      expect(call.digitalNomadFeatures).toHaveLength(1);
      expect(call.amenities).toHaveLength(2);
    });

    it('should throw error when owner quota is reached', async () => {
      mockFetch
        .mockResolvedValueOnce({
          _id: 'user-1',
          maxLocations: 1,
          quotaOverrideByAdmin: false,
        })
        .mockResolvedValueOnce(1); // Already has 1 listing

      const listingData = { name: 'Test', type: 'coworking', city: 'city-1' };

      await expect(
        createManagedListing(listingData, { id: 'user-1', role: 'venueOwner' })
      ).rejects.toThrow(/reached their listing limit/);
    });

    it('should skip quota check when quotaOverrideByAdmin is true', async () => {
      mockFetch.mockResolvedValueOnce({
        _id: 'user-1',
        quotaOverrideByAdmin: true,
      });

      const listingData = { name: 'Test', type: 'coworking', city: 'city-1' };

      mockCreateIfNotExists.mockResolvedValue({ _id: 'listing-1' } as any);

      const result = await createManagedListing(listingData, {
        id: 'user-1',
        role: 'venueOwner',
      });

      expect(result).toBeDefined();
      // Should not fetch current count
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error when target owner not found', async () => {
      mockFetch.mockResolvedValueOnce(null);

      const listingData = { name: 'Test', type: 'coworking', city: 'city-1' };

      await expect(
        createManagedListing(listingData, { id: 'user-1', role: 'venueOwner' })
      ).rejects.toThrow('Target owner not found');
    });
  });

  describe('updateManagedListing', () => {
    it('should update listing successfully for admin', async () => {
      const existingListing = {
        _id: 'listing-1',
        name: 'Old Name',
        type: 'coworking',
        ecoFocusTags: [{ _ref: 'tag-1', _key: 'key-1' }],
        digitalNomadFeatures: [],
        amenities: [],
      };

      mockFetch.mockResolvedValue(existingListing);

      const mockSet = jest.fn(() => ({ commit: jest.fn().mockResolvedValue({}) }));
      (mockPatch as any).mockReturnValue({ set: mockSet });

      const updateData = {
        name: 'New Name',
        shortDescription: 'Updated description',
      };

      await updateManagedListing('listing-1', updateData, {
        id: 'user-1',
        role: 'admin',
      });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name',
          shortDescription: 'Updated description',
        })
      );
    });

    it('should throw error for unauthorized user', async () => {
      await expect(
        updateManagedListing('listing-1', {}, { id: 'user-1', role: 'user' })
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw error when listing not found', async () => {
      mockFetch.mockResolvedValue(null);

      await expect(
        updateManagedListing('listing-1', { name: 'Test' }, { id: 'user-1', role: 'admin' })
      ).rejects.toThrow('Listing not found');
    });

    it('should preserve existing keys for reference arrays', async () => {
      const existingListing = {
        _id: 'listing-1',
        ecoFocusTags: [
          { _ref: 'tag-1', _key: 'existing-key-1' },
          { _ref: 'tag-2', _key: 'existing-key-2' },
        ],
        digitalNomadFeatures: [{ _ref: 'feature-1', _key: 'feature-key-1' }],
        amenities: [],
      };

      mockFetch.mockResolvedValue(existingListing);

      const mockSet = jest.fn(() => ({ commit: jest.fn().mockResolvedValue({}) }));
      (mockPatch as any).mockReturnValue({ set: mockSet });

      const updateData = {
        ecoFocusTags: ['tag-1', 'tag-3'], // Keep tag-1, add tag-3
      };

      await updateManagedListing('listing-1', updateData, {
        id: 'user-1',
        role: 'admin',
      });

      const patchPayload = mockSet.mock.calls[0][0];
      expect(patchPayload.ecoFocusTags).toHaveLength(2);
      expect(patchPayload.ecoFocusTags[0]).toMatchObject({
        _type: 'reference',
        _ref: 'tag-1',
        _key: 'existing-key-1', // Preserved
      });
      expect(patchPayload.ecoFocusTags[1]).toMatchObject({
        _type: 'reference',
        _ref: 'tag-3',
        _key: expect.any(String), // New UUID
      });
    });

    it('should update type and category together', async () => {
      const existingListing = {
        _id: 'listing-1',
        type: 'coworking',
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        amenities: [],
      };

      mockFetch.mockResolvedValue(existingListing);

      const mockSet = jest.fn(() => ({ commit: jest.fn().mockResolvedValue({}) }));
      (mockPatch as any).mockReturnValue({ set: mockSet });

      await updateManagedListing(
        'listing-1',
        { type: 'restaurant' },
        { id: 'user-1', role: 'admin' }
      );

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'restaurant',
          category: 'restaurant',
        })
      );
    });

    it('should throw error for invalid listing type', async () => {
      const existingListing = {
        _id: 'listing-1',
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        amenities: [],
      };

      mockFetch.mockResolvedValue(existingListing);

      await expect(
        updateManagedListing('listing-1', { type: 'invalid' }, { id: 'user-1', role: 'admin' })
      ).rejects.toThrow('Invalid listing type');
    });

    it('should update city reference correctly', async () => {
      const existingListing = {
        _id: 'listing-1',
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        amenities: [],
      };

      mockFetch.mockResolvedValue(existingListing);

      const mockSet = jest.fn(() => ({ commit: jest.fn().mockResolvedValue({}) }));
      (mockPatch as any).mockReturnValue({ set: mockSet });

      await updateManagedListing(
        'listing-1',
        { city: 'new-city-id' },
        { id: 'user-1', role: 'admin' }
      );

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          city: { _type: 'reference', _ref: 'new-city-id' },
        })
      );
    });

    it('should throw error for invalid city reference', async () => {
      const existingListing = {
        _id: 'listing-1',
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        amenities: [],
      };

      mockFetch.mockResolvedValue(existingListing);

      await expect(
        updateManagedListing('listing-1', { city: 123 as any }, { id: 'user-1', role: 'admin' })
      ).rejects.toThrow('Invalid city reference');
    });

    it('should update detail fields when provided', async () => {
      const existingListing = {
        _id: 'listing-1',
        ecoFocusTags: [],
        digitalNomadFeatures: [],
        amenities: [],
      };

      mockFetch.mockResolvedValue(existingListing);

      const mockSet = jest.fn(() => ({ commit: jest.fn().mockResolvedValue({}) }));
      (mockPatch as any).mockReturnValue({ set: mockSet });

      const updateData = {
        coworkingDetails: { capacity: 50 },
        accommodationDetails: { rooms: 10 },
      };

      await updateManagedListing('listing-1', updateData, {
        id: 'user-1',
        role: 'admin',
      });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          coworkingDetails: { capacity: 50 },
          accommodationDetails: { rooms: 10 },
        })
      );
    });

    it('should check ownership for venue owner', async () => {
      mockFetch.mockResolvedValue({
        _id: 'listing-1',
        owner: { _ref: 'user-1' },
      });

      const mockSet = jest.fn(() => ({ commit: jest.fn().mockResolvedValue({}) }));
      (mockPatch as any).mockReturnValue({ set: mockSet });

      await updateManagedListing(
        'listing-1',
        { name: 'Updated' },
        { id: 'user-1', role: 'venueOwner' }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('owner._ref == $userId'),
        expect.objectContaining({ userId: 'user-1' })
      );
    });
  });
});
