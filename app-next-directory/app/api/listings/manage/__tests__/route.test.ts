import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock dependencies
jest.mock('@/lib/auth', () => ({
  __esModule: true,
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  __esModule: true,
  structuredLogger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/lib/sanity', () => {
  const fetchMock = jest.fn();
  const createIfNotExistsMock = jest.fn();

  return {
    __esModule: true,
    client: {
      fetch: fetchMock,
      createIfNotExists: createIfNotExistsMock,
    },
    __mock: { fetchMock, createIfNotExistsMock },
  };
});

jest.mock('@/lib/utils/slug', () => ({
  __esModule: true,
  toSlug: jest.fn((name: string) => name.toLowerCase().replace(/\s+/g, '-')),
}));

jest.mock('@/types/listings', () => ({
  __esModule: true,
  isListingTypeValue: jest.fn(),
}));

jest.mock('uuid', () => ({
  __esModule: true,
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

const mockAuthModule = jest.requireMock('@/lib/auth') as {
  auth: jest.Mock;
};

const mockLoggerModule = jest.requireMock('@/lib/logger') as {
  structuredLogger: {
    warn: jest.Mock;
    error: jest.Mock;
    info: jest.Mock;
  };
};

const mockSanityModule = jest.requireMock('@/lib/sanity') as {
  client: {
    fetch: jest.Mock;
    createIfNotExists: jest.Mock;
  };
  __mock: {
    fetchMock: jest.Mock;
    createIfNotExistsMock: jest.Mock;
  };
};

const mockListingsModule = jest.requireMock('@/types/listings') as {
  isListingTypeValue: jest.Mock;
};

const mockAuth = mockAuthModule.auth;
const mockFetch = mockSanityModule.__mock.fetchMock;
const mockCreateIfNotExists = mockSanityModule.__mock.createIfNotExistsMock;
const mockIsListingTypeValue = mockListingsModule.isListingTypeValue;

describe('/api/listings/manage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 204 when headers() is unavailable during prerender', async () => {
      mockAuth.mockRejectedValue(new Error('headers() unavailable'));

      const { GET } = await import('../route');
      const mockRequest = {
        url: 'https://example.com/api/listings/manage',
        headers: new Headers(),
      } as any;

      const response = await GET(mockRequest);

      expect(response.status).toBe(204);
      expect(mockLoggerModule.structuredLogger.warn).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const { GET } = await import('../route');
      const mockRequest = {
        url: 'https://example.com/api/listings/manage',
        headers: new Headers(),
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 when user has no id', async () => {
      mockAuth.mockResolvedValue({
        user: { role: 'venueOwner' },
      });

      const { GET } = await import('../route');
      const mockRequest = {
        url: 'https://example.com/api/listings/manage',
        headers: new Headers(),
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 for regular users', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-123', role: 'user' },
      });

      const { GET } = await import('../route');
      const mockRequest = {
        url: 'https://example.com/api/listings/manage',
        headers: new Headers(),
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return all listings for admin', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'admin-123', role: 'admin' },
      });
      mockFetch.mockResolvedValue([
        {
          _id: 'listing-1',
          name: 'Test Listing',
          city: 'Berlin',
          status: 'published',
          moderationStatus: 'approved',
        },
      ]);

      const { GET } = await import('../route');
      const mockRequest = {
        url: 'https://example.com/api/listings/manage',
        headers: new Headers(),
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.listings).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('*[_type == "listing"]'),
        { userId: 'admin-123' }
      );
    });

    it('should return filtered listings for venue owner', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockFetch.mockResolvedValue([
        {
          _id: 'listing-1',
          name: 'My Listing',
          city: 'Berlin',
          status: 'draft',
          moderationStatus: 'pending',
        },
      ]);

      const { GET } = await import('../route');
      const mockRequest = {
        url: 'https://example.com/api/listings/manage',
        headers: new Headers(),
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.listings).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('owner._ref == $userId'),
        { userId: 'venue-123' }
      );
    });

    it('should handle fetch errors', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'admin-123', role: 'admin' },
      });
      mockFetch.mockRejectedValue(new Error('Sanity fetch failed'));

      const { GET } = await import('../route');
      const mockRequest = {
        url: 'https://example.com/api/listings/manage',
        headers: new Headers(),
      } as any;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch listings');
      expect(mockLoggerModule.structuredLogger.error).toHaveBeenCalled();
    });
  });

  describe('POST', () => {
    const createMockRequest = (body: any) => ({
      url: 'https://example.com/api/listings/manage',
      headers: new Headers(),
      json: async () => body,
    }) as any;

    it('should return 204 when headers() is unavailable during prerender', async () => {
      mockAuth.mockRejectedValue(new Error('During prerendering failed'));

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({}));

      expect(response.status).toBe(204);
    });

    it('should return 401 when user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({}));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 when name is missing', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        type: 'cafe',
        city: 'city-123',
      }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Listing name is required');
    });

    it('should return 400 when type is invalid', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockIsListingTypeValue.mockReturnValue(false);

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'invalid',
        city: 'city-123',
      }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Listing type is required');
    });

    it('should return 400 when city is missing', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockIsListingTypeValue.mockReturnValue(true);

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'cafe',
      }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('City reference is required');
    });

    it('should create listing for venue owner', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockIsListingTypeValue.mockReturnValue(true);
      mockFetch.mockResolvedValueOnce({
        _id: 'venue-123',
        maxLocations: 5,
      });
      mockFetch.mockResolvedValueOnce(2);
      mockCreateIfNotExists.mockResolvedValue({
        _id: 'mock-uuid-1234',
        name: 'Test Listing',
      });

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'cafe',
        city: 'city-123',
      }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data._id).toBe('mock-uuid-1234');
      expect(mockCreateIfNotExists).toHaveBeenCalled();
    });

    it('should return 403 when quota is exceeded', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockIsListingTypeValue.mockReturnValue(true);
      mockFetch.mockResolvedValueOnce({
        _id: 'venue-123',
        maxLocations: 3,
      });
      mockFetch.mockResolvedValueOnce(3);

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'cafe',
        city: 'city-123',
      }));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('quota_exceeded');
      expect(data.currentCount).toBe(3);
      expect(data.limit).toBe(3);
    });

    it('should use tier-based quota when maxLocations is not set', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockIsListingTypeValue.mockReturnValue(true);
      mockFetch.mockResolvedValueOnce({
        _id: 'venue-123',
        listingQuotaTier: 'pro',
      });
      mockFetch.mockResolvedValueOnce(4);
      mockCreateIfNotExists.mockResolvedValue({
        _id: 'mock-uuid-1234',
      });

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'cafe',
        city: 'city-123',
      }));

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('count(*[_type == "listing"'),
        { ownerRef: 'venue-123' }
      );
    });

    it('should bypass quota check when quotaOverrideByAdmin is true', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockIsListingTypeValue.mockReturnValue(true);
      mockFetch.mockResolvedValueOnce({
        _id: 'venue-123',
        maxLocations: 1,
        quotaOverrideByAdmin: true,
      });
      mockCreateIfNotExists.mockResolvedValue({
        _id: 'mock-uuid-1234',
      });

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'cafe',
        city: 'city-123',
      }));

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should allow admin to specify owner', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'admin-123', role: 'admin' },
      });
      mockIsListingTypeValue.mockReturnValue(true);
      mockFetch.mockResolvedValueOnce({
        _id: 'other-user-123',
        maxLocations: 5,
      });
      mockFetch.mockResolvedValueOnce(0);
      mockCreateIfNotExists.mockResolvedValue({
        _id: 'mock-uuid-1234',
      });

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'cafe',
        city: 'city-123',
        owner: 'other-user-123',
      }));

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        { id: 'other-user-123' }
      );
    });

    it('should return 404 when target owner not found', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'admin-123', role: 'admin' },
      });
      mockIsListingTypeValue.mockReturnValue(true);
      mockFetch.mockResolvedValueOnce(null);

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'cafe',
        city: 'city-123',
        owner: 'nonexistent-user',
      }));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Target owner not found');
    });

    it('should include optional fields in listing payload', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockIsListingTypeValue.mockReturnValue(true);
      mockFetch.mockResolvedValueOnce({
        _id: 'venue-123',
        maxLocations: 5,
      });
      mockFetch.mockResolvedValueOnce(0);
      mockCreateIfNotExists.mockResolvedValue({
        _id: 'mock-uuid-1234',
      });

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'cafe',
        city: 'city-123',
        shortDescription: 'Short desc',
        longDescription: 'Long desc',
        address: '123 Main St',
        contactPhone: '+1234567890',
        contactEmail: 'test@example.com',
        website: 'https://example.com',
        priceRange: '$$',
      }));

      expect(response.status).toBe(200);
      expect(mockCreateIfNotExists).toHaveBeenCalledWith(
        expect.objectContaining({
          shortDescription: 'Short desc',
          longDescription: 'Long desc',
          address: '123 Main St',
          contactPhone: '+1234567890',
          contactEmail: 'test@example.com',
          website: 'https://example.com',
          priceRange: '$$',
        })
      );
    });

    it('should include images in listing payload', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockIsListingTypeValue.mockReturnValue(true);
      mockFetch.mockResolvedValueOnce({
        _id: 'venue-123',
        maxLocations: 5,
      });
      mockFetch.mockResolvedValueOnce(0);
      mockCreateIfNotExists.mockResolvedValue({
        _id: 'mock-uuid-1234',
      });

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'cafe',
        city: 'city-123',
        primaryImage: { _type: 'image', asset: { _ref: 'image-1' } },
        galleryImages: [
          { _type: 'image', asset: { _ref: 'image-2' } },
          { _type: 'image', asset: { _ref: 'image-3' } },
        ],
      }));

      expect(response.status).toBe(200);
      expect(mockCreateIfNotExists).toHaveBeenCalledWith(
        expect.objectContaining({
          primaryImage: { _type: 'image', asset: { _ref: 'image-1' } },
          galleryImages: expect.arrayContaining([
            { _type: 'image', asset: { _ref: 'image-2' } },
            { _type: 'image', asset: { _ref: 'image-3' } },
          ]),
        })
      );
    });

    it('should include ecoFocusTags as references', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockIsListingTypeValue.mockReturnValue(true);
      mockFetch.mockResolvedValueOnce({
        _id: 'venue-123',
        maxLocations: 5,
      });
      mockFetch.mockResolvedValueOnce(0);
      mockCreateIfNotExists.mockResolvedValue({
        _id: 'mock-uuid-1234',
      });

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'cafe',
        city: 'city-123',
        ecoFocusTags: ['tag-1', 'tag-2'],
      }));

      expect(response.status).toBe(200);
      expect(mockCreateIfNotExists).toHaveBeenCalledWith(
        expect.objectContaining({
          ecoFocusTags: [
            { _type: 'reference', _ref: 'tag-1', _key: 'mock-uuid-1234' },
            { _type: 'reference', _ref: 'tag-2', _key: 'mock-uuid-1234' },
          ],
        })
      );
    });

    it('should include digitalNomadFeatures as references', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockIsListingTypeValue.mockReturnValue(true);
      mockFetch.mockResolvedValueOnce({
        _id: 'venue-123',
        maxLocations: 5,
      });
      mockFetch.mockResolvedValueOnce(0);
      mockCreateIfNotExists.mockResolvedValue({
        _id: 'mock-uuid-1234',
      });

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'coworking',
        city: 'city-123',
        digitalNomadFeatures: ['feature-1', 'feature-2'],
      }));

      expect(response.status).toBe(200);
      expect(mockCreateIfNotExists).toHaveBeenCalledWith(
        expect.objectContaining({
          digitalNomadFeatures: [
            { _type: 'reference', _ref: 'feature-1', _key: 'mock-uuid-1234' },
            { _type: 'reference', _ref: 'feature-2', _key: 'mock-uuid-1234' },
          ],
        })
      );
    });

    it('should include amenities as references', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockIsListingTypeValue.mockReturnValue(true);
      mockFetch.mockResolvedValueOnce({
        _id: 'venue-123',
        maxLocations: 5,
      });
      mockFetch.mockResolvedValueOnce(0);
      mockCreateIfNotExists.mockResolvedValue({
        _id: 'mock-uuid-1234',
      });

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'accommodation',
        city: 'city-123',
        amenities: ['amenity-1', 'amenity-2'],
      }));

      expect(response.status).toBe(200);
      expect(mockCreateIfNotExists).toHaveBeenCalledWith(
        expect.objectContaining({
          amenities: [
            { _type: 'reference', _ref: 'amenity-1', _key: 'mock-uuid-1234' },
            { _type: 'reference', _ref: 'amenity-2', _key: 'mock-uuid-1234' },
          ],
        })
      );
    });

    it('should include type-specific details', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockIsListingTypeValue.mockReturnValue(true);
      mockFetch.mockResolvedValueOnce({
        _id: 'venue-123',
        maxLocations: 5,
      });
      mockFetch.mockResolvedValueOnce(0);
      mockCreateIfNotExists.mockResolvedValue({
        _id: 'mock-uuid-1234',
      });

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Accommodation',
        type: 'accommodation',
        city: 'city-123',
        accommodationDetails: {
          bedrooms: 2,
          bathrooms: 1,
        },
      }));

      expect(response.status).toBe(200);
      expect(mockCreateIfNotExists).toHaveBeenCalledWith(
        expect.objectContaining({
          accommodationDetails: {
            bedrooms: 2,
            bathrooms: 1,
          },
        })
      );
    });

    it('should handle quota validation errors', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockIsListingTypeValue.mockReturnValue(true);
      mockFetch.mockRejectedValue(new Error('Database error'));

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'cafe',
        city: 'city-123',
      }));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to validate owner quota');
    });

    it('should handle creation errors', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockIsListingTypeValue.mockReturnValue(true);
      mockFetch.mockResolvedValueOnce({
        _id: 'venue-123',
        maxLocations: 5,
      });
      mockFetch.mockResolvedValueOnce(0);
      mockCreateIfNotExists.mockRejectedValue(new Error('Sanity write failed'));

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'cafe',
        city: 'city-123',
      }));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create listing');
      expect(mockLoggerModule.structuredLogger.error).toHaveBeenCalled();
    });

    it('should use free tier default when no tier is set', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'venue-123', role: 'venueOwner' },
      });
      mockIsListingTypeValue.mockReturnValue(true);
      mockFetch.mockResolvedValueOnce({
        _id: 'venue-123',
      });
      mockFetch.mockResolvedValueOnce(0);
      mockCreateIfNotExists.mockResolvedValue({
        _id: 'mock-uuid-1234',
      });

      const { POST } = await import('../route');
      const response = await POST(createMockRequest({
        name: 'Test Listing',
        type: 'cafe',
        city: 'city-123',
      }));

      expect(response.status).toBe(200);
    });
  });
});
