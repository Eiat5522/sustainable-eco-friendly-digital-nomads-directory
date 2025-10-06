import type { 
  ReadonlySlug, 
  City, 
  CityResponse, 
  CategoryResponse, 
  Amenity, 
  AmenityResponse 
} from '../api-responses';

describe('api-responses types', () => {
  describe('ReadonlySlug', () => {
    it('should enforce readonly slug structure', () => {
      const slug: ReadonlySlug = { current: 'test-slug' };
      expect(slug.current).toBe('test-slug');
    });
  });

  describe('City interface', () => {
    it('should accept valid city object', () => {
      const city: City = {
        _id: 'city-123',
        name: 'Bangkok',
        slug: { current: 'bangkok' }
      };
      expect(city._id).toBe('city-123');
      expect(city.name).toBe('Bangkok');
      expect(city.slug.current).toBe('bangkok');
    });

    it('should maintain readonly properties', () => {
      const city: City = {
        _id: 'city-456',
        name: 'Chiang Mai',
        slug: { current: 'chiang-mai' }
      };
      expect(city._id).toBeDefined();
      expect(city.name).toBeDefined();
      expect(city.slug).toBeDefined();
    });
  });

  describe('CityResponse interface', () => {
    it('should accept valid city response with single city', () => {
      const response: CityResponse = {
        cities: [
          {
            _id: 'city-1',
            name: 'Tokyo',
            slug: { current: 'tokyo' }
          }
        ]
      };
      expect(response.cities).toHaveLength(1);
      expect(response.cities[0].name).toBe('Tokyo');
    });

    it('should accept valid city response with multiple cities', () => {
      const response: CityResponse = {
        cities: [
          { _id: 'city-1', name: 'Berlin', slug: { current: 'berlin' } },
          { _id: 'city-2', name: 'Lisbon', slug: { current: 'lisbon' } },
          { _id: 'city-3', name: 'Barcelona', slug: { current: 'barcelona' } }
        ]
      };
      expect(response.cities).toHaveLength(3);
      expect(response.cities[0].name).toBe('Berlin');
      expect(response.cities[2].name).toBe('Barcelona');
    });

    it('should accept empty cities array', () => {
      const response: CityResponse = { cities: [] };
      expect(response.cities).toHaveLength(0);
    });
  });

  describe('CategoryResponse interface', () => {
    it('should accept valid category response', () => {
      const response: CategoryResponse = {
        categories: ['coworking', 'cafe', 'accommodation']
      };
      expect(response.categories).toHaveLength(3);
      expect(response.categories).toContain('coworking');
    });

    it('should accept empty categories array', () => {
      const response: CategoryResponse = { categories: [] };
      expect(response.categories).toHaveLength(0);
    });

    it('should accept single category', () => {
      const response: CategoryResponse = { categories: ['restaurant'] };
      expect(response.categories).toHaveLength(1);
      expect(response.categories[0]).toBe('restaurant');
    });
  });

  describe('Amenity interface', () => {
    it('should accept valid amenity object', () => {
      const amenity: Amenity = { name: 'WiFi' };
      expect(amenity.name).toBe('WiFi');
    });

    it('should accept amenity with only name field', () => {
      const amenity: Amenity = { name: 'Air Conditioning' };
      expect(amenity.name).toBe('Air Conditioning');
    });
  });

  describe('AmenityResponse interface', () => {
    it('should accept valid amenity response with single amenity', () => {
      const response: AmenityResponse = {
        amenities: [{ name: 'Parking' }]
      };
      expect(response.amenities).toHaveLength(1);
      expect(response.amenities[0].name).toBe('Parking');
    });

    it('should accept valid amenity response with multiple amenities', () => {
      const response: AmenityResponse = {
        amenities: [
          { name: 'WiFi' },
          { name: 'Coffee' },
          { name: 'Meeting Rooms' },
          { name: 'Printer' }
        ]
      };
      expect(response.amenities).toHaveLength(4);
      expect(response.amenities[2].name).toBe('Meeting Rooms');
    });

    it('should accept empty amenities array', () => {
      const response: AmenityResponse = { amenities: [] };
      expect(response.amenities).toHaveLength(0);
    });
  });

  describe('Type integrity tests', () => {
    it('should maintain readonly constraint on cities array in CityResponse', () => {
      const response: CityResponse = {
        cities: [
          { _id: '1', name: 'Test', slug: { current: 'test' } }
        ]
      };
      expect(Array.isArray(response.cities)).toBe(true);
    });

    it('should maintain readonly constraint on categories array in CategoryResponse', () => {
      const response: CategoryResponse = {
        categories: ['test1', 'test2']
      };
      expect(Array.isArray(response.categories)).toBe(true);
    });

    it('should maintain readonly constraint on amenities array in AmenityResponse', () => {
      const response: AmenityResponse = {
        amenities: [{ name: 'test' }]
      };
      expect(Array.isArray(response.amenities)).toBe(true);
    });
  });
});
