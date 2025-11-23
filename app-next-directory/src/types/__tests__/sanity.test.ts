import type { Amenity, SanityDocument } from '../sanity';

describe('sanity types', () => {
  describe('SanityDocument interface', () => {
    it('should accept valid Sanity document', () => {
      const doc: SanityDocument = {
        _id: 'doc-123',
        _type: 'listing',
        _createdAt: '2024-01-15T10:00:00Z',
        _updatedAt: '2024-01-16T15:30:00Z',
        _rev: 'abc123',
      };
      expect(doc._id).toBe('doc-123');
      expect(doc._type).toBe('listing');
      expect(doc._createdAt).toBe('2024-01-15T10:00:00Z');
    });

    it('should accept different document types', () => {
      const listingDoc: SanityDocument = {
        _id: 'listing-1',
        _type: 'listing',
        _createdAt: '2024-01-15T10:00:00Z',
        _updatedAt: '2024-01-15T10:00:00Z',
        _rev: 'rev1',
      };

      const cityDoc: SanityDocument = {
        _id: 'city-1',
        _type: 'city',
        _createdAt: '2024-01-15T10:00:00Z',
        _updatedAt: '2024-01-15T10:00:00Z',
        _rev: 'rev2',
      };

      expect(listingDoc._type).toBe('listing');
      expect(cityDoc._type).toBe('city');
    });

    it('should track creation and update dates', () => {
      const doc: SanityDocument = {
        _id: 'doc-1',
        _type: 'test',
        _createdAt: '2024-01-01T00:00:00Z',
        _updatedAt: '2024-01-15T00:00:00Z',
        _rev: 'rev1',
      };
      expect(doc._createdAt).not.toBe(doc._updatedAt);
    });

    it('should have unique revision identifier', () => {
      const doc1: SanityDocument = {
        _id: 'doc-1',
        _type: 'test',
        _createdAt: '2024-01-15T10:00:00Z',
        _updatedAt: '2024-01-15T10:00:00Z',
        _rev: 'rev-abc123',
      };

      const doc2: SanityDocument = {
        _id: 'doc-1',
        _type: 'test',
        _createdAt: '2024-01-15T10:00:00Z',
        _updatedAt: '2024-01-16T10:00:00Z',
        _rev: 'rev-xyz789',
      };

      expect(doc1._rev).not.toBe(doc2._rev);
    });
  });

  describe('Amenity interface', () => {
    it('should accept basic amenity', () => {
      const amenity: Amenity = {
        _id: 'amenity-123',
        name: 'WiFi',
      };
      expect(amenity._id).toBe('amenity-123');
      expect(amenity.name).toBe('WiFi');
    });

    it('should accept amenity with description', () => {
      const amenity: Amenity = {
        _id: 'amenity-456',
        name: 'High-Speed Internet',
        description: 'Fiber optic internet with speeds up to 500 Mbps',
      };
      expect(amenity.description).toBeDefined();
    });

    it('should accept amenity with badge', () => {
      const amenity: Amenity = {
        _id: 'amenity-789',
        name: 'Eco Certified',
        description: 'Environmental certification',
        badge: {
          asset: {
            url: 'https://cdn.sanity.io/images/project/dataset/badge.png',
          },
        },
      };
      expect(amenity.badge?.asset?.url).toBeDefined();
    });

    it('should accept amenity with nested optional properties', () => {
      const amenity: Amenity = {
        _id: 'amenity-1',
        name: 'Test',
        badge: {},
      };
      expect(amenity.badge).toBeDefined();
      expect(amenity.badge?.asset).toBeUndefined();
    });

    it('should handle multiple amenities', () => {
      const amenities: Amenity[] = [
        { _id: 'am-1', name: 'WiFi' },
        { _id: 'am-2', name: 'Coffee', description: 'Free coffee' },
        {
          _id: 'am-3',
          name: 'Parking',
          description: 'Free parking',
          badge: { asset: { url: 'url' } },
        },
      ];
      expect(amenities).toHaveLength(3);
      expect(amenities[2].badge).toBeDefined();
    });
  });

  describe('Type usage patterns', () => {
    it('should support filtering documents by type', () => {
      const documents: SanityDocument[] = [
        {
          _id: '1',
          _type: 'listing',
          _createdAt: '2024-01-15T10:00:00Z',
          _updatedAt: '2024-01-15T10:00:00Z',
          _rev: 'r1',
        },
        {
          _id: '2',
          _type: 'city',
          _createdAt: '2024-01-15T10:00:00Z',
          _updatedAt: '2024-01-15T10:00:00Z',
          _rev: 'r2',
        },
        {
          _id: '3',
          _type: 'listing',
          _createdAt: '2024-01-15T10:00:00Z',
          _updatedAt: '2024-01-15T10:00:00Z',
          _rev: 'r3',
        },
      ];

      const listings = documents.filter(doc => doc._type === 'listing');
      expect(listings).toHaveLength(2);
    });

    it('should support sorting documents by date', () => {
      const documents: SanityDocument[] = [
        {
          _id: '1',
          _type: 'test',
          _createdAt: '2024-01-03T00:00:00Z',
          _updatedAt: '2024-01-03T00:00:00Z',
          _rev: 'r1',
        },
        {
          _id: '2',
          _type: 'test',
          _createdAt: '2024-01-01T00:00:00Z',
          _updatedAt: '2024-01-01T00:00:00Z',
          _rev: 'r2',
        },
        {
          _id: '3',
          _type: 'test',
          _createdAt: '2024-01-02T00:00:00Z',
          _updatedAt: '2024-01-02T00:00:00Z',
          _rev: 'r3',
        },
      ];

      const sorted = [...documents].sort((a, b) => a._createdAt.localeCompare(b._createdAt));

      expect(sorted[0]._id).toBe('2');
      expect(sorted[2]._id).toBe('1');
    });

    it('should support amenity filtering', () => {
      const amenities: Amenity[] = [
        { _id: '1', name: 'WiFi' },
        { _id: '2', name: 'Coffee' },
        { _id: '3', name: 'WiFi' },
        { _id: '4', name: 'Parking' },
      ];

      const wifiAmenities = amenities.filter(a => a.name === 'WiFi');
      expect(wifiAmenities).toHaveLength(2);
    });
  });
});
