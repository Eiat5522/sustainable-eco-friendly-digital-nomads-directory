/**
 * Unit tests for src/types/index.ts
 * Tests type exports and interfaces
 */

import type {
  EcoTag,
  FilterGroup,
  FilterOption,
  Listing,
  LocalCity,
  LocalCityPageProps,
  SearchFilters,
  StrictComponent,
  StrictProps,
  UnifiedListing,
} from '../index';

describe('src/types/index', () => {
  describe('Type Exports', () => {
    it('should export StrictComponent and StrictProps types', () => {
      // These are re-exported types, we just verify they are exported
      const typeCheck: StrictComponent = null as any;
      const propsCheck: StrictProps = null as any;
      expect(typeCheck).toBeDefined();
      expect(propsCheck).toBeDefined();
    });
  });

  describe('EcoTag Interface', () => {
    it('should allow valid EcoTag objects', () => {
      const ecoTag: EcoTag = {
        id: 'eco-1',
        label: 'Solar Powered',
        impact: 'high',
      };
      expect(ecoTag.id).toBe('eco-1');
      expect(ecoTag.impact).toBe('high');
    });

    it('should support all impact levels', () => {
      const impacts: Array<EcoTag['impact']> = ['high', 'medium', 'low'];
      expect(impacts).toHaveLength(3);
    });
  });

  describe('SearchFilters Interface', () => {
    it('should allow partial search filters', () => {
      const filters: SearchFilters = {
        category: ['coworking'],
        query: 'eco friendly',
      };
      expect(filters.category).toContain('coworking');
      expect(filters.query).toBe('eco friendly');
    });

    it('should allow all optional properties', () => {
      const filters: SearchFilters = {};
      expect(filters).toBeDefined();
    });

    it('should allow price range filters', () => {
      const filters: SearchFilters = {
        minPrice: 10,
        maxPrice: 100,
      };
      expect(filters.minPrice).toBe(10);
      expect(filters.maxPrice).toBe(100);
    });
  });

  describe('FilterOption Interface', () => {
    it('should allow basic filter options', () => {
      const option: FilterOption = {
        id: 'opt-1',
        label: 'WiFi Available',
      };
      expect(option.id).toBe('opt-1');
      expect(option.label).toBe('WiFi Available');
    });

    it('should allow optional properties', () => {
      const option: FilterOption = {
        id: 'opt-2',
        label: 'Solar Power',
        count: 15,
        icon: 'solar',
        ecoImpact: 'high',
      };
      expect(option.count).toBe(15);
      expect(option.ecoImpact).toBe('high');
    });
  });

  describe('FilterGroup Interface', () => {
    it('should allow filter groups with options', () => {
      const group: FilterGroup = {
        id: 'group-1',
        label: 'Eco Features',
        options: [
          { id: 'opt-1', label: 'Solar' },
          { id: 'opt-2', label: 'Recycling' },
        ],
      };
      expect(group.options).toHaveLength(2);
    });

    it('should support multiSelect option', () => {
      const group: FilterGroup = {
        id: 'group-2',
        label: 'Amenities',
        options: [],
        multiSelect: true,
        icon: 'check',
      };
      expect(group.multiSelect).toBe(true);
    });
  });

  describe('LocalCity Interface', () => {
    it('should allow complete city objects', () => {
      const city: LocalCity = {
        id: 'city-1',
        name: 'Chiang Mai',
        country: 'Thailand',
        slug: 'chiang-mai',
        description: 'Digital nomad hub',
        coordinates: {
          latitude: 18.7883,
          longitude: 98.9853,
        },
      };
      expect(city.name).toBe('Chiang Mai');
      expect(city.coordinates?.latitude).toBe(18.7883);
    });

    it('should allow optional properties', () => {
      const city: LocalCity = {
        id: 'city-2',
        name: 'Bangkok',
        country: 'Thailand',
        slug: 'bangkok',
        description: 'Capital city',
        shortDescription: 'Modern capital',
        internetSpeed: 100,
        costOfLiving: 'medium',
        sustainabilityInitiatives: ['solar', 'recycling'],
        digitalNomadFeatures: ['coworking', 'cafes'],
      };
      expect(city.internetSpeed).toBe(100);
      expect(city.sustainabilityInitiatives).toHaveLength(2);
    });
  });

  describe('Listing Interface', () => {
    it('should allow basic listing objects', () => {
      const listing: Listing = {
        id: 'list-1',
        name: 'Eco Coworking',
        slug: 'eco-coworking',
        cityId: 'city-1',
        category: 'coworking',
        shortDescription: 'Green workspace',
        longDescription: 'A sustainable coworking space',
        imageUrl: 'https://example.com/image.jpg',
      };
      expect(listing.name).toBe('Eco Coworking');
      expect(listing.category).toBe('coworking');
    });

    it('should allow optional properties', () => {
      const listing: Listing = {
        id: 'list-2',
        name: 'Green Cafe',
        slug: 'green-cafe',
        cityId: 'city-2',
        category: 'cafe',
        shortDescription: 'Eco cafe',
        longDescription: 'Sustainable cafe',
        imageUrl: 'https://example.com/cafe.jpg',
        coordinates: { latitude: 18.7, longitude: 98.9 },
        eco_features: ['solar', 'composting'],
        amenities: ['wifi', 'power outlets'],
        price: 150,
        currency: 'THB',
        reviewCount: 42,
      };
      expect(listing.eco_features).toContain('solar');
      expect(listing.reviewCount).toBe(42);
    });
  });

  describe('LocalCityPageProps Interface', () => {
    it('should allow city page props', () => {
      const props: LocalCityPageProps = {
        city: 'bangkok',
        listings: [],
      };
      expect(props.city).toBe('bangkok');
      expect(props.listings).toEqual([]);
    });
  });

  describe('UnifiedListing Interface', () => {
    it('should allow unified listing objects', () => {
      const listing: UnifiedListing = {
        id: 'unified-1',
        slug: 'test-listing',
        title: 'Test Listing',
        city: 'Bangkok',
        address: '123 Test St',
        ecoTags: ['solar'],
        ecoNotesDetailed: 'Very eco friendly',
      };
      expect(listing.title).toBe('Test Listing');
      expect(listing.ecoTags).toContain('solar');
    });
  });
});
