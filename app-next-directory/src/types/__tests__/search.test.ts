import type {
  SearchFilters,
  SustainabilityScore,
  SortOption,
  SearchResult,
  SearchResults,
  SearchParamRecord
} from '../search';

describe('search types', () => {
  describe('SearchFilters interface', () => {
    it('should accept basic search filters', () => {
      const filters: SearchFilters = {
        query: 'coworking',
        ecoTags: [],
        hasDigitalNomadFeatures: false
      };
      expect(filters.query).toBe('coworking');
      expect(filters.ecoTags).toHaveLength(0);
      expect(filters.hasDigitalNomadFeatures).toBe(false);
    });

    it('should accept all category types', () => {
      const filters1: SearchFilters = {
        query: '',
        category: 'coworking',
        ecoTags: [],
        hasDigitalNomadFeatures: false
      };
      const filters2: SearchFilters = {
        query: '',
        category: 'cafe',
        ecoTags: [],
        hasDigitalNomadFeatures: false
      };
      const filters3: SearchFilters = {
        query: '',
        category: 'accommodation',
        ecoTags: [],
        hasDigitalNomadFeatures: false
      };
      expect(filters1.category).toBe('coworking');
      expect(filters2.category).toBe('cafe');
      expect(filters3.category).toBe('accommodation');
    });

    it('should accept city filter', () => {
      const filters: SearchFilters = {
        query: '',
        city: 'Bangkok',
        ecoTags: [],
        hasDigitalNomadFeatures: false
      };
      expect(filters.city).toBe('Bangkok');
    });

    it('should accept ecoTags array', () => {
      const filters: SearchFilters = {
        query: '',
        ecoTags: ['solar-power', 'recycling', 'organic'],
        hasDigitalNomadFeatures: false
      };
      expect(filters.ecoTags).toHaveLength(3);
      expect(filters.ecoTags).toContain('organic');
    });

    it('should accept hasDigitalNomadFeatures boolean', () => {
      const filters: SearchFilters = {
        query: '',
        ecoTags: [],
        hasDigitalNomadFeatures: true
      };
      expect(filters.hasDigitalNomadFeatures).toBe(true);
    });

    it('should accept optional minSustainabilityScore', () => {
      const filters: SearchFilters = {
        query: '',
        ecoTags: [],
        hasDigitalNomadFeatures: false,
        minSustainabilityScore: 4
      };
      expect(filters.minSustainabilityScore).toBe(4);
    });

    it('should accept optional maxPriceRange', () => {
      const filters: SearchFilters = {
        query: '',
        ecoTags: [],
        hasDigitalNomadFeatures: false,
        maxPriceRange: 1000
      };
      expect(filters.maxPriceRange).toBe(1000);
    });

    it('should accept all properties together', () => {
      const filters: SearchFilters = {
        query: 'eco cafe',
        category: 'cafe',
        city: 'Chiang Mai',
        ecoTags: ['organic', 'zero-waste'],
        hasDigitalNomadFeatures: true,
        minSustainabilityScore: 3,
        maxPriceRange: 500
      };
      expect(filters.query).toBe('eco cafe');
      expect(filters.category).toBe('cafe');
      expect(filters.city).toBe('Chiang Mai');
    });
  });

  describe('SustainabilityScore interface', () => {
    it('should accept valid sustainability score', () => {
      const score: SustainabilityScore = {
        score: 4.5,
        factors: {
          ecoInitiatives: 5,
          wasteManagement: 4,
          energyEfficiency: 4,
          localSourcing: 5
        }
      };
      expect(score.score).toBe(4.5);
      expect(score.factors.ecoInitiatives).toBe(5);
    });

    it('should accept all factor scores', () => {
      const score: SustainabilityScore = {
        score: 3.75,
        factors: {
          ecoInitiatives: 4,
          wasteManagement: 3,
          energyEfficiency: 4,
          localSourcing: 4
        }
      };
      expect(score.factors.wasteManagement).toBe(3);
      expect(score.factors.energyEfficiency).toBe(4);
    });

    it('should handle different score values', () => {
      const scores: SustainabilityScore[] = [
        { score: 1, factors: { ecoInitiatives: 1, wasteManagement: 1, energyEfficiency: 1, localSourcing: 1 } },
        { score: 5, factors: { ecoInitiatives: 5, wasteManagement: 5, energyEfficiency: 5, localSourcing: 5 } }
      ];
      expect(scores[0].score).toBe(1);
      expect(scores[1].score).toBe(5);
    });
  });

  describe('SortOption interface', () => {
    it('should accept relevance sort', () => {
      const sort: SortOption = {
        field: 'relevance',
        direction: 'desc',
        label: 'Relevance'
      };
      expect(sort.field).toBe('relevance');
    });

    it('should accept all field types', () => {
      const fields: SortOption['field'][] = ['relevance', 'price', 'rating', 'sustainability', 'distance'];
      fields.forEach(field => {
        const sort: SortOption = { field, direction: 'asc', label: field };
        expect(sort.field).toBe(field);
      });
    });

    it('should accept both direction values', () => {
      const sortAsc: SortOption = { field: 'price', direction: 'asc', label: 'Price Low to High' };
      const sortDesc: SortOption = { field: 'price', direction: 'desc', label: 'Price High to Low' };
      expect(sortAsc.direction).toBe('asc');
      expect(sortDesc.direction).toBe('desc');
    });

    it('should include label', () => {
      const sort: SortOption = {
        field: 'rating',
        direction: 'desc',
        label: 'Highest Rated'
      };
      expect(sort.label).toBe('Highest Rated');
    });
  });

  describe('SearchResult interface', () => {
    it('should accept valid search result', () => {
      const result: SearchResult = {
        _id: 'listing-123',
        name: 'Eco Coworking',
        slug: 'eco-coworking',
        descriptionShort: 'A sustainable workspace',
        category: 'coworking',
        city: {
          name: 'Bangkok',
          slug: 'bangkok'
        },
        primaryImage: {
          asset: {
            _ref: 'image-ref',
            url: 'https://example.com/image.jpg'
          }
        },
        ecoTags: ['solar-power', 'recycling'],
        nomadFeatures: ['wifi', 'meeting-rooms']
      };
      expect(result._id).toBe('listing-123');
      expect(result.name).toBe('Eco Coworking');
      expect(result.city.name).toBe('Bangkok');
    });

    it('should accept optional coordinates in city', () => {
      const result: SearchResult = {
        _id: 'test',
        name: 'Test',
        slug: 'test',
        descriptionShort: 'Test',
        category: 'cafe',
        city: {
          name: 'Test City',
          slug: 'test-city',
          coordinates: { lat: 13.7563, lng: 100.5018 }
        },
        primaryImage: { asset: { _ref: 'ref', url: 'url' } },
        ecoTags: [],
        nomadFeatures: []
      };
      expect(result.city.coordinates?.lat).toBe(13.7563);
    });

    it('should accept optional top-level coordinates', () => {
      const result: SearchResult = {
        _id: 'test',
        name: 'Test',
        slug: 'test',
        descriptionShort: 'Test',
        category: 'cafe',
        city: { name: 'Test', slug: 'test' },
        coordinates: { lat: 13.7563, lng: 100.5018 },
        primaryImage: { asset: { _ref: 'ref', url: 'url' } },
        ecoTags: [],
        nomadFeatures: []
      };
      expect(result.coordinates?.lat).toBe(13.7563);
    });

    it('should accept optional alt text in primaryImage', () => {
      const result: SearchResult = {
        _id: 'test',
        name: 'Test',
        slug: 'test',
        descriptionShort: 'Test',
        category: 'cafe',
        city: { name: 'Test', slug: 'test' },
        primaryImage: {
          asset: { _ref: 'ref', url: 'url' },
          alt: 'Image description'
        },
        ecoTags: [],
        nomadFeatures: []
      };
      expect(result.primaryImage.alt).toBe('Image description');
    });

    it('should accept optional priceRange', () => {
      const result: SearchResult = {
        _id: 'test',
        name: 'Test',
        slug: 'test',
        descriptionShort: 'Test',
        category: 'cafe',
        city: { name: 'Test', slug: 'test' },
        primaryImage: { asset: { _ref: 'ref', url: 'url' } },
        ecoTags: [],
        nomadFeatures: [],
        priceRange: { min: 100, max: 500, currency: 'THB' }
      };
      expect(result.priceRange?.min).toBe(100);
      expect(result.priceRange?.currency).toBe('THB');
    });

    it('should accept optional rating and sustainabilityScore', () => {
      const result: SearchResult = {
        _id: 'test',
        name: 'Test',
        slug: 'test',
        descriptionShort: 'Test',
        category: 'cafe',
        city: { name: 'Test', slug: 'test' },
        primaryImage: { asset: { _ref: 'ref', url: 'url' } },
        ecoTags: [],
        nomadFeatures: [],
        rating: 4.5,
        sustainabilityScore: 4.2
      };
      expect(result.rating).toBe(4.5);
      expect(result.sustainabilityScore).toBe(4.2);
    });

    it('should accept optional search score', () => {
      const result: SearchResult = {
        _id: 'test',
        name: 'Test',
        slug: 'test',
        descriptionShort: 'Test',
        category: 'cafe',
        city: { name: 'Test', slug: 'test' },
        primaryImage: { asset: { _ref: 'ref', url: 'url' } },
        ecoTags: [],
        nomadFeatures: [],
        _score: 0.85
      };
      expect(result._score).toBe(0.85);
    });
  });

  describe('SearchResults interface', () => {
    it('should accept valid search results', () => {
      const results: SearchResults = {
        results: [],
        pagination: {
          total: 0,
          page: 1,
          totalPages: 0,
          hasMore: false
        }
      };
      expect(results.results).toHaveLength(0);
      expect(results.pagination.total).toBe(0);
    });

    it('should accept results with data', () => {
      const mockResult: SearchResult = {
        _id: '1',
        name: 'Test',
        slug: 'test',
        descriptionShort: 'Test',
        category: 'coworking',
        city: { name: 'Bangkok', slug: 'bangkok' },
        primaryImage: { asset: { _ref: 'ref', url: 'url' } },
        ecoTags: [],
        nomadFeatures: []
      };

      const results: SearchResults = {
        results: [mockResult],
        pagination: {
          total: 1,
          page: 1,
          totalPages: 1,
          hasMore: false
        }
      };
      expect(results.results).toHaveLength(1);
      expect(results.pagination.hasMore).toBe(false);
    });

    it('should handle pagination correctly', () => {
      const results: SearchResults = {
        results: [],
        pagination: {
          total: 100,
          page: 3,
          totalPages: 10,
          hasMore: true
        }
      };
      expect(results.pagination.page).toBe(3);
      expect(results.pagination.totalPages).toBe(10);
      expect(results.pagination.hasMore).toBe(true);
    });
  });

  describe('SearchParamRecord type', () => {
    it('should accept string values', () => {
      const params: SearchParamRecord = {
        query: 'test',
        category: 'coworking'
      };
      expect(params.query).toBe('test');
    });

    it('should accept string array values', () => {
      const params: SearchParamRecord = {
        tags: ['tag1', 'tag2', 'tag3']
      };
      expect(Array.isArray(params.tags)).toBe(true);
    });

    it('should accept undefined values', () => {
      const params: SearchParamRecord = {
        query: 'test',
        optional: undefined
      };
      expect(params.optional).toBeUndefined();
    });

    it('should accept mixed value types', () => {
      const params: SearchParamRecord = {
        query: 'test',
        tags: ['tag1', 'tag2'],
        optional: undefined,
        city: 'Bangkok'
      };
      expect(params.query).toBe('test');
      expect(params.tags).toHaveLength(2);
      expect(params.optional).toBeUndefined();
    });
  });

  describe('Integration tests', () => {
    it('should work with complete search workflow', () => {
      const filters: SearchFilters = {
        query: 'eco coworking',
        category: 'coworking',
        city: 'Bangkok',
        ecoTags: ['solar-power'],
        hasDigitalNomadFeatures: true,
        minSustainabilityScore: 4
      };

      const mockResult: SearchResult = {
        _id: '123',
        name: 'Green Workspace',
        slug: 'green-workspace',
        descriptionShort: 'Eco-friendly coworking space',
        category: 'coworking',
        city: { name: 'Bangkok', slug: 'bangkok' },
        primaryImage: { asset: { _ref: 'img-ref', url: 'https://example.com/img.jpg' } },
        ecoTags: ['solar-power', 'recycling'],
        nomadFeatures: ['wifi', 'meeting-rooms'],
        sustainabilityScore: 4.5,
        rating: 4.8
      };

      const results: SearchResults = {
        results: [mockResult],
        pagination: {
          total: 1,
          page: 1,
          totalPages: 1,
          hasMore: false
        }
      };

      expect(filters.query).toBe('eco coworking');
      expect(results.results[0].sustainabilityScore).toBe(4.5);
    });
  });
});
